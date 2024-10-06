const sqlite3 = require("sqlite3").verbose();
const databasePath = process.env.DATABASE_PATH;

function initializeDatabase() {
  let db = new sqlite3.Database(databasePath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            address TEXT,
            phone_number TEXT,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT DEFAULT (datetime('now', 'localtime'))
        );`);

    db.run(`CREATE TABLE IF NOT EXISTS Orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount_paid REAL NOT NULL,
            order_number TEXT NOT NULL UNIQUE,
            date TEXT NOT NULL,
            paystack_reference TEXT,
            order_details TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
        );`);

    db.run(`CREATE TABLE IF NOT EXISTS Reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            table_number INTEGER NOT NULL,
            number_of_guests INTEGER NOT NULL,
            date_time TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
        );`);
  });

  db.close((err) => {
    if (err) {
      console.error("Error closing database connection:", err.message);
    }
  });
}

module.exports = initializeDatabase;
