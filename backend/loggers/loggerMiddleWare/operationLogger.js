const sqlite3 = require("sqlite3").verbose();
const databasePath = process.env.DATABASE_PATH;


function logOperation(adminId, activity, sessionId = null) {
    const timestamp = new Date().toISOString(); 
    let db = new sqlite3.Database(databasePath);
    let sql = `INSERT INTO ActivityLog (admin_id, activity, session_id, timestamp) VALUES (?, ?, ?, ?)`;

    db.run(sql, [adminId, activity, sessionId, timestamp], function (err) {
        if (err) {
            console.error("Error logging operation:", err.message);
        }
    });

    db.close();
}

function operationLogger(activityDescription) {
    return (req, res, next) => {
        const adminId = req.adminId; 
        const sessionId = req.sessionID; 

        if (adminId) {
            logOperation(adminId, activityDescription, sessionId);
        }
        next();
    };
}

module.exports = operationLogger;
