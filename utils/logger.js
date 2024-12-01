const fs = require('fs');
const path = require('path');

function logError(type, error) {
    const logPath = path.join(__dirname, '../errors.log');
    const errorMessage = `[${new Date().toISOString()}] ${type}: ${error}\n`;

    fs.appendFile(logPath, errorMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

module.exports = { logError };
