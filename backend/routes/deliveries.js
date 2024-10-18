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
    { location: "Ikoyi", rate: 2500 },
    { location: "VI", rate: 1500 },
    { location: "Ikeja", rate: 7000 },
    { location: "Lekki", rate: 3000 },
    { location: "Ajah", rate: 4500 },
    { location: "LBS", rate: 5200 },
    { location: "Sangotedo", rate: 5500 },
  ];

  res.json({ deliveryRates });
});

module.exports = router;
