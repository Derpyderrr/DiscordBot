const sqlite3 = require('sqlite3').verbose();

function setupDatabase(dbPath) {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error connecting to the database:', err.message);
            process.exit(1);
        }
        console.log('Connected to the SQLite database.');
    });

    // Example: Create a basic table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            discord_id TEXT UNIQUE NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        }
    });

    return db;
}

module.exports = { setupDatabase };
