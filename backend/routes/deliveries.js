const express = require("express");
const multer = require("multer");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const databasePath = process.env.DATABASE_PATH;

const db = new sqlite3.Database(databasePath);



/**
 * @swagger
 * /api/deliveries/deliveryRates:
 *   get:
 *     summary: Get delivery rates for different locations
 *     tags: [Delivery]
 *     responses:
 *       200:
 *         description: List of delivery rates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryRates:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       location:
 *                         type: string
 *                         description: Name of the location
 *                       rate:
 *                         type: number
 *                         description: Delivery rate for the location
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
 */
router.get("/deliveryRates", (req, res) => {
  const deliveryRates = [
    { location: "Ikoyi", rate: 2000 },
    { location: "VI", rate: 1000 },
    { location: "Ikeja", rate: 6500 },
    { location: "Lekki", rate: 2500 },
    { location: "Ajah", rate: 4000 },
    { location: "LBS", rate: 4800 },
    { location: "Sangotedo", rate: 5000 },
  ];

  res.json({ deliveryRates });
});

module.exports = router;
