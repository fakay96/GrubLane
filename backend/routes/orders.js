const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const databasePath = process.env.DATABASE_PATH;
const redis = require("redis");


const ORDER_QUEUE = process.env.ORDER_QUEUE;
const redisClient = redis.createClient({
  url: 'redis://localhost:6379' // Adjust as necessary for your setup
});
/**
 * @swagger
 * /api/orders:
 *   post:
 *     description: Create a new order
 *     tags: [Orders]
 *     parameters:
 *       - name: user_id
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: amount_paid
 *         in: body
 *         required: true
 *         schema:
 *           type: number
 *       - name: order_number
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: date
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *       - name: paystack_reference
 *         in: body
 *         required: false
 *         schema:
 *           type: string
 *       - name: order_details
 *         in: body
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Order already exists
 */
router.post("/", (req, res) => {
  const {
    user_id,
    amount_paid,
    order_number,
    date,
    paystack_reference,
    order_details,
  } = req.body;
  
  if (!user_id || !amount_paid || !order_number || !date) {
    return res.status(400).json({
      error: "User ID, amount paid, order number, and date are required.",
    });
  }

  let db = new sqlite3.Database(databasePath);

  // Query to get user details from the User table based on user_id
  let userSql = `SELECT name, phone_number, address FROM User WHERE id = ?`;

  db.get(userSql, [user_id], (err, userRow) => {
    if (err) {
      return res.status(500).json({ error: "Failed to retrieve user details" });
    }
    if (!userRow) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user details are retrieved successfully, check if the order already exists
    let checkSql = `SELECT id FROM Orders WHERE order_number = ?`;
    db.get(checkSql, [order_number], (err, row) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (row) {
        return res.status(409).json({ error: "Order with this order number already exists." });
      }

      // Insert order into the Orders table
      let insertSql = `INSERT INTO Orders (user_id, amount_paid, order_number, date, paystack_reference, order_details) VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(
        insertSql,
        [user_id, amount_paid, order_number, date, paystack_reference, order_details],
        function (err) {
          if (err) {
            return res.status(400).json({ error: err.message });
          }

          // Prepare user details to send to Redis queue
          let userDetails = {
            name: userRow.name,
            phone_number: userRow.phone_number,
            address: userRow.address,
          };

          let orderData = {
            ...userDetails,  // Add the user details to the order details
            amount_paid,
            order_number,
            date,
            paystack_reference,
            order_details
          };

          // Push orderData to the Redis queue
          redisClient.rPush(ORDER_QUEUE, JSON.stringify(orderData))
            .then(() => {
              console.log("Order details sent to queue:", orderData);
              // Send a successful response only after Redis queue operation
              res.status(201).json({ id: this.lastID });
            })
            .catch(err => {
              console.error("Failed to add order to queue:", err);
              return res.status(500).json({ error: "Failed to process order." });
            });

          // Close the database connection
          db.close((err) => {
            if (err) {
              console.error("Error closing database connection:", err.message);
            }
          });
        }
      );
    });
  });
});


/**
 * @swagger
 * /api/orders:
 *   get:
 *     description: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 *       400:
 *         description: Bad request
 */
router.get("/", (req, res) => {
  let db = new sqlite3.Database(databasePath);
  let sql = `SELECT * FROM Orders`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(200).json({ orders: rows });
  });
  db.close((err) => {
    if (err) {
      console.error("Error closing database connection:", err.message);
    }
  });
});

module.exports = router;
