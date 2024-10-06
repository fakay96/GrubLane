const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const databasePath = process.env.DATABASE_PATH;
const redis = require("redis");


const PAYMENT_QUEUE = process.env.PAYMENT_QUEUE;

const redisClient = redis.createClient({
  url: 'redis://localhost:6379' // Adjust as necessary for your setup
});
redisClient.connect().catch(err => console.error('Redis Client Error', err));
/**
 * @swagger
 * /api/payments/createPayments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Payment object that needs to be created
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - order_id
 *             - amount
 *             - payment_date
 *             - payment_method
 *             - status
 *           properties:
 *             order_id:
 *               type: string
 *               description: The ID of the order
 *             amount:
 *               type: number
 *               description: The amount of the payment
 *             payment_date:
 *               type: string
 *               format: date
 *               description: The date of the payment
 *             payment_method:
 *               type: string
 *               description: The payment method used
 *             status:
 *               type: string
 *               description: The status of the payment
 *             paystack_refnumber:
 *               type: string
 *               description: The reference number from Paystack
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: The auto-generated ID of the payment
 *             order_id:
 *               type: string
 *             amount:
 *               type: number
 *             payment_date:
 *               type: string
 *               format: date
 *             payment_method:
 *               type: string
 *             status:
 *               type: string
 *             paystack_refnumber:
 *               type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/createPayments", (req, res) => {
  const {
    order_id,
    amount,
    payment_date,
    payment_method,
    status,
    paystack_refnumber,
  } = req.body;

  if (!order_id || !amount || !payment_date || !payment_method || !status) {
    return res.status(400).json({ error: "All fields are required" });
  }

  let db = new sqlite3.Database(databasePath);
  let sql = `INSERT INTO Payments (order_id, amount, payment_date, payment_method, status, paystack_refnumber) VALUES (?, ?, ?, ?, ?, ?)`;
  let paymentDetails={
    order_id,
      amount,
      payment_date,
      payment_method,
      status,
      paystack_refnumber

  }
  db.run(
    sql,
    [
      order_id,
      amount,
      payment_date,
      payment_method,
      status,
      paystack_refnumber,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error creating payment" });
      }
      redisClient.rPush(PAYMENT_QUEUE, JSON.stringify(paymentDetails))
            .then(() => {
              console.log("Reservation details sent to queue:", paymentDetails);
            })
            .catch(err => {
              console.error("Failed to add reservation to queue:", err);
            });
      res.status(201).json({
        id: this.lastID,
        order_id,
        amount,
        payment_date,
        payment_method,
        status,
        paystack_refnumber,
      });
    }
  );

  db.close();
});

/**
 * @swagger
 * /api/payments/getPayments:
 *   get:
 *     summary: Retrieve a list of payments
 *     tags: [Payments]
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number to retrieve
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: The number of payments per page
 *     responses:
 *       200:
 *         description: A list of payments with pagination information
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The auto-generated ID of the payment
 *                   order_id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   payment_date:
 *                     type: string
 *                     format: date
 *                   payment_method:
 *                     type: string
 *                   status:
 *                     type: string
 *                   paystack_refnumber:
 *                     type: string
 *             pagination:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPayments:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 nextUrl:
 *                   type: string
 *                   nullable: true
 *                 prevUrl:
 *                   type: string
 *                   nullable: true
 *       500:
 *         description: Server error
 */
router.get("/getPayments", (req, res) => {
  const { page = 1, pageSize = 10, status = "" } = req.query;

  const limit = parseInt(pageSize);
  const currentPage = parseInt(page);
  const offset = (currentPage - 1) * limit;

  let db = new sqlite3.Database(databasePath);
  let querySql = `
      SELECT * FROM Payments
      WHERE status LIKE ?
      ORDER BY payment_date DESC
      LIMIT ? OFFSET ?
  `;
  let countSql = `SELECT COUNT(*) AS count FROM Payments WHERE status LIKE ?`;

  const statusFilter = status ? `%${status}%` : "%";

  db.get(countSql, [statusFilter], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching payments count" });
    }

    const totalPayments = countResult.count;
    const totalPages = Math.ceil(totalPayments / limit);

    db.all(querySql, [statusFilter, limit, offset], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Error fetching payments" });
      }

      const nextPage = currentPage < totalPages ? currentPage + 1 : null;
      const prevPage = currentPage > 1 ? currentPage - 1 : null;

      const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
      const nextUrl = nextPage
        ? `${baseUrl}?page=${nextPage}&pageSize=${limit}&status=${status}`
        : null;
      const prevUrl = prevPage
        ? `${baseUrl}?page=${prevPage}&pageSize=${limit}&status=${status}`
        : null;

      res.status(200).json({
        data: rows,
        pagination: {
          currentPage,
          pageSize: limit,
          totalPayments,
          totalPages,
          nextUrl,
          prevUrl,
        },
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
