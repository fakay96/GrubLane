const express = require("express");
const multer = require("multer");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const databasePath = process.env.DATABASE_PATH;

const db = new sqlite3.Database(databasePath);

// Define storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/app/database/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

/**
 * @swagger
 * /api/dish/getDishes:
 *   get:
 *     tags: [Dishes]
 *     summary: Get dishes with their average ratings based on the take_out flag of the menu with pagination
 *     parameters:
 *       - in: query
 *         name: take_out
 *         schema:
 *           type: boolean
 *         required: false
 *         description: The take_out flag of the menu
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: The page number to retrieve
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: The number of dishes to return per page (default is 20)
 *     responses:
 *       200:
 *         description: List of dishes with average ratings and pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 next:
 *                   type: string
 *                   description: The URL for the next page of results
 *                 previous:
 *                   type: string
 *                   description: The URL for the previous page of results
 *                 count:
 *                   type: integer
 *                   description: The total number of dishes
 *                 dishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       servicetype:
 *                         type: string
 *                         description: The name of the menu associated with the dish
 *                       subcategory:
 *                         type: string
 *                         description: The subcategory of the dish
 *                       image_link:
 *                         type: string
 *                         description: The relative path to the dish's image
 *                       average_rating:
 *                         type: number
 *                         description: The average rating of the dish
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
router.get("/getDishes", (req, res) => {
  const take_out = req.query.take_out;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let baseQuery = `
        SELECT Dish.id, Dish.name, Dish.price, Menu.name AS serviceType, Dish.subcategory, Dish.image_link, IFNULL(Dish.average_rating, 0) AS average_rating
        FROM Dish
        INNER JOIN Menu ON Dish.menu_id = Menu.id
    `;

  let countQuery = `
        SELECT COUNT(*) AS total 
        FROM Dish
        INNER JOIN Menu ON Dish.menu_id = Menu.id
    `;

  const queryParams = [];

  if (take_out !== undefined) {
    baseQuery += ` WHERE Menu.take_out = ?`;
    countQuery += ` WHERE Menu.take_out = ?`;
    queryParams.push(take_out === "true");
  }

  baseQuery += ` ORDER BY Dish.subcategory ASC, Dish.name ASC LIMIT ? OFFSET ?`; // Ordered by subcategory and then by name alphabetically
  queryParams.push(limit, offset);

  db.get(
    countQuery,
    queryParams.slice(0, queryParams.length - 2),
    (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const totalItems = countResult.total;
      const totalPages = Math.ceil(totalItems / limit);

      db.all(baseQuery, queryParams, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const protocol = req.protocol;
        const host = "grublanerestaurant.com";

        const dishes = rows.map((row) => ({
          id: row.id,
          name: row.name,
          price: row.price,
          servicetype: row.serviceType,
          subcategory: row.subcategory,
          image_link: row.image_link
            ? `${protocol}://${host}/images/${path.basename(row.image_link)}`
            : null,
          average_rating: row.average_rating,
        }));

        const nextPage =
          page < totalPages
            ? `${protocol}://${host}/api/dish${req.path}?page=${
                page + 1
              }&limit=${limit}`
            : null;
        const prevPage =
          page > 1
            ? `${protocol}://${host}/api/dish${req.path}?page=${
                page - 1
              }&limit=${limit}`
            : null;

        res.json({
          next: nextPage,
          previous: prevPage,
          count: totalItems,
          dishes,
        });
      });
    }
  );
});



const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;

    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
});

/**
 * @swagger
 * /api/dish/createDish:
 *   post:
 *     summary: Create a new dish
 *     tags: [Dishes]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: name
 *         type: string
 *         required: true
 *         description: Name of the dish
 *       - in: formData
 *         name: price
 *         type: number
 *         required: true
 *         description: Price of the dish
 *       - in: formData
 *         name: menu_id
 *         type: integer
 *         required: true
 *         description: ID of the menu to which the dish belongs
 *       - in: formData
 *         name: subcategory
 *         type: string
 *         required: false
 *         description: Subcategory of the dish
 *       - in: formData
 *         name: image
 *         type: file
 *         required: false
 *         description: Image of the dish (optional)
 *     responses:
 *       201:
 *         description: Dish created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The dish ID
 *                 name:
 *                   type: string
 *                   description: The name of the dish
 *                 price:
 *                   type: number
 *                   description: The price of the dish
 *                 menu_id:
 *                   type: integer
 *                   description: The ID of the menu to which the dish belongs
 *                 subcategory:
 *                   type: string
 *                   description: The subcategory of the dish
 *                 image_url:
 *                   type: string
 *                   description: The full URL to access the dish's image
 *       400:
 *         description: Invalid input, object invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
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
router.post("/createDish", upload.single("image"), (req, res) => {
  const { name, price, menu_id, subcategory } = req.body;

  if (!name || !price || !menu_id) {
    return res.status(400).json({
      error: "Fields (name, price, menu_id) are required.",
    });
  }

  if (isNaN(price) || isNaN(menu_id)) {
    return res
      .status(400)
      .json({ error: "Price and menu_id must be valid numbers." });
  }

  const image_filename = req.file ? req.file.filename : null;

  const image_link = image_filename
    ? `/app/database/images/${image_filename}`
    : null;
  const host = "grublanerestaurant.com";
  const protocol = req.protocol;
  const image_url = image_filename
    ? `${protocol}://${host}/images/${image_filename}`
    : null;

  const query = `
        INSERT INTO Dish (name, price, menu_id, subcategory, image_link)
        VALUES (?, ?, ?, ?, ?)
    `;

  db.run(
    query,
    [name, price, menu_id, subcategory || null, image_link],
    function (err) {
      if (err) {
        if (err.message.includes("FOREIGN KEY")) {
          return res.status(400).json({
            error: "Invalid menu_id. Please provide a valid menu_id.",
          });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        price,
        menu_id,
        subcategory,
        image_url,
      });
    }
  );
});


/**
 * @swagger
 * /api/dish/deleteDish/{id}:
 *   delete:
 *     summary: Delete a dish by ID
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: id
 *         type: integer
 *         required: true
 *         description: ID of the dish to delete
 *     responses:
 *       200:
 *         description: Dish deleted successfully
 *       404:
 *         description: Dish not found
 *       500:
 *         description: Server error
 */

router.delete("/deleteDish/:id", (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM Dish WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Dish not found." });
    }

    res.status(200).json({ message: "Dish deleted successfully." });
  });
});
/**
 * @swagger
 * /api/dish/updateDish/{id}:
 *   put:
 *     summary: Update a dish by ID
 *     tags: [Dishes]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         type: integer
 *         required: true
 *         description: ID of the dish to update
 *       - in: formData
 *         name: name
 *         type: string
 *         required: false
 *         description: Name of the dish
 *       - in: formData
 *         name: price
 *         type: number
 *         required: false
 *         description: Price of the dish
 *       - in: formData
 *         name: menu_id
 *         type: integer
 *         required: false
 *         description: ID of the menu to which the dish belongs
 *       - in: formData
 *         name: subcategory
 *         type: string
 *         required: false
 *         description: Subcategory of the dish
 *       - in: formData
 *         name: image
 *         type: file
 *         required: false
 *         description: Image of the dish
 *     responses:
 *       200:
 *         description: Dish updated successfully
 *       400:
 *         description: Invalid input, object invalid
 *       404:
 *         description: Dish not found
 *       500:
 *         description: Server error
 */

router.put("/updateDish/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, price, menu_id, subcategory } = req.body;

  if (price && isNaN(price)) {
    return res.status(400).json({ error: "Price must be a valid number." });
  }
  if (menu_id && isNaN(menu_id)) {
    return res.status(400).json({ error: "Menu ID must be a valid number." });
  }

  let query = `UPDATE Dish SET `;
  const queryParams = [];

  if (name) {
    query += `name = ?, `;
    queryParams.push(name);
  }
  if (price) {
    query += `price = ?, `;
    queryParams.push(price);
  }
  if (menu_id) {
    query += `menu_id = ?, `;
    queryParams.push(menu_id);
  }
  if (subcategory) {
    query += `subcategory = ?, `;
    queryParams.push(subcategory);
  }
  if (req.file) {
    const image_filename = req.file.filename;
    const image_link = `/app/database/images/${image_filename}`;
    query += `image_link = ?, `;
    queryParams.push(image_link);
  }

  query = query.slice(0, -2);
  query += ` WHERE id = ?`;
  queryParams.push(id);

  db.run(query, queryParams, function (err) {
    if (err) {
      if (err.message.includes("FOREIGN KEY")) {
        return res
          .status(400)
          .json({ error: "Invalid menu_id. Please provide a valid menu_id." });
      }
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Dish not found." });
    }

    res.status(200).json({ message: "Dish updated successfully." });
  });
});

/**
 * @swagger
 * /api/dish/rateDish/{id}:
 *   post:
 *     summary: Rate a dish by ID
 *     tags: [Dishes]
 *     parameters:
 *       - in: path
 *         name: id
 *         type: integer
 *         required: true
 *         description: ID of the dish to rate
 *       - in: formData
 *         name: rating
 *         type: integer
 *         required: true
 *         description: Rating for the dish (1-5)
 *     responses:
 *       201:
 *         description: Rating added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Dish not found
 *       500:
 *         description: Server error
 */
router.post("/rateDish/:id", (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ error: "Rating must be an integer between 1 and 5." });
  }

  const insertQuery = `INSERT INTO Ratings (dish_id, rating) VALUES (?, ?)`;
  db.run(insertQuery, [id, rating], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const updateQuery = `
      UPDATE Dish
      SET average_rating = (
        SELECT AVG(rating)
        FROM Ratings
        WHERE dish_id = ?
      )
      WHERE id = ?
    `;
    db.run(updateQuery, [id, id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res
        .status(201)
        .json({ message: "Rating added and average updated successfully." });
    });
  });
});

module.exports = router;
