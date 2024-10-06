const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const databasePath = process.env.DATABASE_PATH;
const redis = require("redis");
const redisClient = redis.createClient();

/**
 * @swagger
 * /api/users:
 *   post:
 *     description: Create a new user
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: User already exists
 */
router.post("/", (req, res) => {
  const { email, address, phone_number, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required." });
  }

  let db = new sqlite3.Database(databasePath);
  let checkSql = `SELECT id FROM User WHERE email = ?`;
  db.get(checkSql, [email], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (row) {
      return res.status(200).json({ id: row.id });
    }

    let insertSql = `INSERT INTO User (email, address, phone_number, name) VALUES (?, ?, ?, ?)`;
    db.run(insertSql, [email, address, phone_number, name], function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    });

    db.close((err) => {
      if (err) {
        console.error("Error closing database connection:", err.message);
      }
    });
  });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a paginated list of users
 *     tags: [Customers]
 *     description: Get all users with pagination. You can specify the page number and page size.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of users to retrieve per page.
 *     responses:
 *       200:
 *         description: A paginated list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/", (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  const limit = parseInt(pageSize);
  const currentPage = parseInt(page);
  const offset = (currentPage - 1) * limit;

  let db = new sqlite3.Database(databasePath);
  let sql = `SELECT * FROM User LIMIT ? OFFSET ?`;
  let params = [limit, offset];

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const nextPage = currentPage + 1;
    const prevPage = currentPage - 1 > 0 ? currentPage - 1 : null;

    const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
    const nextUrl = rows.length < limit ? null : `${baseUrl}?page=${nextPage}&pageSize=${limit}`;
    const prevUrl = prevPage ? `${baseUrl}?page=${prevPage}&pageSize=${limit}` : null;

    res.status(200).json({
      users: rows,
      pagination: {
        currentPage,
        pageSize: limit,
        nextUrl,
        prevUrl
      }
    });
  });

  db.close((err) => {
    if (err) {
      console.error("Error closing database connection:", err.message);
    }
  });
});

module.exports = router;
