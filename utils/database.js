const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../database/db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Function to initialize the database schema
function setupDatabase() {
    db.serialize(() => {
        console.log('Setting up the database schema...');

        // Create users table if not exists
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                userId TEXT PRIMARY KEY,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                prestige INTEGER DEFAULT 0,
                coins INTEGER DEFAULT 0,
                pet TEXT DEFAULT 'Pet'
            )
        `, (err) => {
            if (err) {
                console.error('Error creating "users" table:', err.message);
            } else {
                console.log('"users" table ready.');
            }
        });

        // Create serverSettings table if not exists
        db.run(`
            CREATE TABLE IF NOT EXISTS serverSettings (
                serverId TEXT PRIMARY KEY,
                levelRoles TEXT DEFAULT '[]',
                shopItems TEXT DEFAULT '[]',
                prestigeReward INTEGER DEFAULT 100
            )
        `, (err) => {
            if (err) {
                console.error('Error creating "serverSettings" table:', err.message);
            } else {
                console.log('"serverSettings" table ready.');
            }
        });
    });
}

// Utility functions for user data
function getUser(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE userId = ?', [userId], (err, row) => {
            if (err) reject(err);
            if (row) resolve(row);
            else {
                // Create default user entry if not found
                const newUser = { userId, xp: 0, level: 1, prestige: 0, coins: 0, pet: 'Pet' };
                db.run(
                    'INSERT INTO users (userId, xp, level, prestige, coins, pet) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, 0, 1, 0, 0, 'Pet'],
                    (err) => {
                        if (err) reject(err);
                        resolve(newUser);
                    }
                );
            }
        });
    });
}

function updateUser(userId, userData) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET xp = ?, level = ?, prestige = ?, coins = ?, pet = ? WHERE userId = ?',
            [userData.xp, userData.level, userData.prestige, userData.coins, userData.pet, userId],
            (err) => {
                if (err) reject(err);
                resolve();
            }
        );
    });
}

// Utility functions for server settings
function getServerSettings(serverId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM serverSettings WHERE serverId = ?', [serverId], (err, row) => {
            if (err) reject(err);
            if (row) {
                try {
                    // Ensure JSON fields are parsed correctly
                    row.levelRoles = JSON.parse(row.levelRoles || '[]');
                    row.shopItems = JSON.parse(row.shopItems || '[]');
                    resolve(row);
                } catch (parseError) {
                    reject(new Error('Failed to parse JSON fields in serverSettings.'));
                }
            } else {
                // Create default settings entry if not found
                const newSettings = { serverId, levelRoles: [], shopItems: [], prestigeReward: 100 };
                db.run(
                    'INSERT INTO serverSettings (serverId, levelRoles, shopItems, prestigeReward) VALUES (?, ?, ?, ?)',
                    [serverId, JSON.stringify([]), JSON.stringify([]), 100],
                    (err) => {
                        if (err) reject(err);
                        resolve(newSettings);
                    }
                );
            }
        });
    });
}

function updateServerSettings(serverId, settings) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE serverSettings SET levelRoles = ?, shopItems = ?, prestigeReward = ? WHERE serverId = ?',
            [
                JSON.stringify(settings.levelRoles || []),
                JSON.stringify(settings.shopItems || []),
                settings.prestigeReward,
                serverId,
            ],
            (err) => {
                if (err) reject(err);
                resolve();
            }
        );
    });
}

module.exports = { setupDatabase, getUser, updateUser, getServerSettings, updateServerSettings };
