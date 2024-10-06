const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const operationLogger = require("../loggers/loggerMiddleWare/operationLogger");
const router = express.Router();
const databasePath = process.env.DATABASE_PATH;
const SECRET_KEY = process.env.JWT_SECRET || "";

function generateToken(admin) {
  return jwt.sign({ id: admin.id, username: admin.username }, SECRET_KEY, {
    expiresIn: "1h",
  });
}

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.adminId = user.id;
    next();
  });
}

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Login an admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The admin's username
 *                 example: adminUser
 *               password:
 *                 type: string
 *                 description: The admin's password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authorization
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 username:
 *                   type: string
 *                   description: The admin's username
 *                   example: adminUser
 *       400:
 *         description: Username and password are required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Username and password are required
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  let db = new sqlite3.Database(databasePath);
  let sql = `SELECT * FROM Admin WHERE username = ?`;

  db.get(sql, [username], (err, admin) => {
    if (err || !admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    bcrypt.compare(password, admin.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(admin);
      res
        .status(200)
        .json({ message: "Login successful", token, username: admin.username });

      logOperation(admin.id, "Logged in");
    });
  });

  db.close();
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Logout an admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No token provided
 */
router.post(
  "/logout",
  authenticateToken,
  operationLogger("Logged out"),
  (req, res) => {
    res.status(200).json({ message: "Logout successful" });
  }
);

/**
 * @swagger
 * /api/admin/createAdmin:
 *   post:
 *     summary: Create a new admin
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The new admin's username
 *                 example: newAdminUser
 *               password:
 *                 type: string
 *                 description: The new admin's password
 *                 example: password123
 *               email:
 *                 type: string
 *                 description: The new admin's email address
 *                 example: admin@example.com
 *               role:
 *                 type: string
 *                 description: The new admin's role
 *                 example: superadmin
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the created admin
 *                   example: 1
 *                 username:
 *                   type: string
 *                   description: The new admin's username
 *                   example: newAdminUser
 *                 email:
 *                   type: string
 *                   description: The new admin's email address
 *                   example: admin@example.com
 *                 role:
 *                   type: string
 *                   description: The new admin's role
 *                   example: superadmin
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: All fields are required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: Error creating admin
 */
 
router.post(
  "/createAdmin",
  operationLogger("Created a new admin"),
  (req, res) => {
    const { username, password, email, role } = req.body;

    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let db = new sqlite3.Database(databasePath);
    let sql = `INSERT INTO Admin (username, password, email, role) VALUES (?, ?, ?, ?)`;

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(sql, [username, hashedPassword, email, role], function (err) {
      if (err) {
        return res.status(500).json({ error: "Error creating admin" });
      }
      res.status(201).json({ id: this.lastID, username, email, role });
    });

    db.close();
  }
);

/**
 * @swagger
 * /api/admin/updateAdmin/{id}:
 *   put:
 *     summary: Update an admin
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: body
 *         name: body
 *         required: true
 *         content:
 *           application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The admin's username
 *                 example: updatedAdminUser
 *               password:
 *                 type: string
 *                 description: The admin's password (optional)
 *                 example: newPassword123
 *               email:
 *                 type: string
 *                 description: The admin's email address
 *                 example: updatedAdmin@example.com
 *               role:
 *                 type: string
 *                 description: The admin's role
 *                 example: admin
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin updated successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Username, email, and role are required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error updating admin
 */
router.put(
  "/updateAdmin/:id",
  operationLogger("Updated an admin"),
  (req, res) => {
    const { id } = req.params;
    const { username, password, email, role } = req.body;

    if (!username || !email || !role) {
      return res
        .status(400)
        .json({ error: "Username, email, and role are required" });
    }

    let db = new sqlite3.Database(databasePath);
    let sql = `UPDATE Admin SET username = ?, email = ?, role = ? WHERE id = ?`;

    const params = [username, email, role, id];
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      sql = `UPDATE Admin SET username = ?, password = ?, email = ?, role = ? WHERE id = ?`;
      params.splice(1, 0, hashedPassword);
    }

    db.run(sql, params, function (err) {
      if (err) {
        return res.status(500).json({ error: "Error updating admin" });
      }
      res.status(200).json({ message: "Admin updated successfully" });
    });

    db.close();
  }
);

/**
 * @swagger
 * /api/deleteAdmin/{id}:
 *   delete:
 *     summary: Delete an admin
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin deleted successfully
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error deleting admin
 */
router.delete(
  "/deleteAdmin/:id",
  operationLogger("Deleted an admin"),
  (req, res) => {
    const { id } = req.params;

    let db = new sqlite3.Database(databasePath);
    let sql = `DELETE FROM Admin WHERE id = ?`;

    db.run(sql, id, function (err) {
      if (err) {
        return res.status(500).json({ error: "Error deleting admin" });
      }
      res.status(200).json({ message: "Admin deleted successfully" });
    });

    db.close();
  }
);

/**
 * @swagger
 * /api/admin/adminActivityLogs:
 *   get:
 *     summary: Retrieve logs of admin activities
 *     tags: [Admin]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: A list of admin activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The auto-generated ID of the log entry
 *                     example: 1
 *                   admin_id:
 *                     type: integer
 *                     description: The ID of the admin who performed the activity
 *                     example: 1
 *                   activity:
 *                     type: string
 *                     description: The description of the admin's activity
 *                     example: Logged in
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: The timestamp of the activity
 *                     example: 2023-08-30T14:48:00.000Z
 *       500:
 *         description: Error fetching activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error fetching activity logs
 */
router.get("/adminActivityLogs", (req, res) => {
  let db = new sqlite3.Database(databasePath);
  let sql = `SELECT * FROM ActivityLog ORDER BY timestamp DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching activity logs" });
    }
    res.status(200).json({ data: rows });
  });

  db.close();
});

module.exports = router;
