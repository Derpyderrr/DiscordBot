const sqlite3 = require('sqlite3').verbose();

function setupDatabase(dbPath) {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Database connection error:', err.message);
        } else {
            console.log('Database initialized successfully.');
        }
    });

    return db;
}

module.exports = { setupDatabase };
