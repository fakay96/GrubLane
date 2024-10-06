const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const router = express.Router();
const redis = require("redis");
const databasePath = process.env.DATABASE_PATH;
const SECRET_KEY = process.env.JWT_SECRET || "";
const RESERVATION_QUEUE = process.env.RESERVATION_QUEUE;

// Create Redis client and connect
const redisClient = redis.createClient({
  url: 'redis://localhost:6379' // Adjust as necessary for your setup
});


redisClient.connect().catch(err => console.error('Redis Client Error', err));

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.userId = user.id;
    next();
  });
}

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: The ID of the user making the reservation
 *               number_of_guests:
 *                 type: integer
 *                 description: The number of guests for the reservation
 *               date_time:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time of the reservation
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the created reservation
 *       400:
 *         description: Bad request, missing required fields
 *       409:
 *         description: Conflict, reservation already exists for the specified user, date, and time
 *       500:
 *         description: Internal server error
 */
router.post("/", (req, res) => {
  const { user_id, number_of_guests, date_time } = req.body;
  const table_number = 0;

  if (!user_id || !number_of_guests || !date_time) {
    return res.status(400).json({
      error: "User ID, number of guests, and date-time are required.",
    });
  }

  let db = new sqlite3.Database(databasePath);

  let checkSql = `SELECT id, email,name FROM User WHERE id = ?`;
  db.get(checkSql, [user_id], (err, userRow) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Internal server error." });
    }
    if (!userRow) {
      return res.status(404).json({ error: "User not found." });
    }

    let email = userRow.email;
    let name= userRow.name;

    let checkReservationSql = `SELECT id FROM Reservations WHERE user_id = ? AND date_time = ?`;
    db.get(checkReservationSql, [user_id, date_time], (err, row) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ error: "Internal server error." });
      }
      if (row) {
        return res.status(201).json({
          error: "Reservation for this user at this date and time already exists.",
        });
      }

      let insertSql = `INSERT INTO Reservations (user_id, table_number, number_of_guests, date_time) VALUES (?, ?, ?, ?)`;
      db.run(
        insertSql,
        [user_id, table_number, number_of_guests, date_time],
        function (err) {
          if (err) {
            console.error("Error inserting reservation:", err.message);
            return res.status(500).json({ error: "Failed to create reservation." });
          }

          const reservationDetails = {
            user_id,
            number_of_guests,
            date_time,
            email,
            name
            
          };

          // Using Promises with Redis client
          
          redisClient.rPush(RESERVATION_QUEUE, JSON.stringify(reservationDetails))
            .then(() => {
              console.log("Reservation details sent to queue:", reservationDetails);
            })
            .catch(err => {
              console.error("Failed to add reservation to queue:", err);
            });

          res.status(201).json({ id: this.lastID });
        }
      );

      db.close((err) => {
        if (err) {
          console.error("Error closing database connection:", err.message);
        }
      });
    });
  });
});

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Retrieve a list of reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: date_time
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by reservation date and time
 *       - in: query
 *         name: table_number
 *         schema:
 *           type: integer
 *         description: Filter by table number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page for pagination
 *     responses:
 *       200:
 *         description: A list of reservations with pagination details and total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       table_number:
 *                         type: integer
 *                       number_of_guests:
 *                         type: integer
 *                       date_time:
 *                         type: string
 *                         format: date-time
 *                       user_name:
 *                         type: string
 *                       user_email:
 *                         type: string
 *                       user_phone:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     nextUrl:
 *                       type: string
 *                       nullable: true
 *                     prevUrl:
 *                       type: string
 *                       nullable: true
 *                 total:
 *                   type: integer
 *                   description: Total number of reservations
 *       401:
 *         description: Unauthorized, token required
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateToken, (req, res) => {
  const { user_id, date_time, table_number, page = 1, pageSize = 10 } = req.query;

  const limit = parseInt(pageSize);
  const currentPage = parseInt(page);
  const offset = (currentPage - 1) * limit;

  let db = new sqlite3.Database(databasePath);
  
  let countSql = `SELECT COUNT(*) AS total FROM Reservations WHERE 1=1`;
  let params = [];

  if (user_id) {
    countSql += " AND user_id = ?";
    params.push(user_id);
  }

  if (date_time) {
    countSql += " AND date_time = ?";
    params.push(date_time);
  }

  if (table_number) {
    countSql += " AND table_number = ?";
    params.push(table_number);
  }

  db.get(countSql, params, (err, countResult) => {
    if (err) {
      console.error("Error counting reservations:", err.message);
      return res.status(500).json({ error: "Internal server error." });
    }

    let querySql = `
      SELECT 
        Reservations.*,
        User.name AS user_name,
        User.email AS user_email,
        User.phone_number AS user_phone
      FROM 
        Reservations
      JOIN 
        User
      ON 
        Reservations.user_id = User.id
      WHERE 
        1=1
    `;

    if (user_id) {
      querySql += " AND Reservations.user_id = ?";
    }

    if (date_time) {
      querySql += " AND Reservations.date_time = ?";
    }

    if (table_number) {
      querySql += " AND Reservations.table_number = ?";
    }

    querySql += " ORDER BY Reservations.date_time DESC";
    querySql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    db.all(querySql, params, (err, rows) => {
      if (err) {
        console.error("Error fetching reservations:", err.message);
        return res.status(500).json({ error: "Internal server error." });
      }

      const total = countResult.total;
      const nextPage = currentPage + 1;
      const prevPage = currentPage - 1 > 0 ? currentPage - 1 : null;

      const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
      const nextUrl = rows.length < limit ? null : `${baseUrl}?page=${nextPage}&pageSize=${limit}`;
      const prevUrl = prevPage ? `${baseUrl}?page=${prevPage}&pageSize=${limit}` : null;

      res.status(200).json({
        data: rows,
        pagination: {
          currentPage,
          pageSize: limit,
          nextUrl,
          prevUrl
        },
        total
      });
    });

    db.close((err) => {
      if (err) {
        console.error("Error closing database connection:", err.message);
      }
    });
  });
});

module.exports = router;
