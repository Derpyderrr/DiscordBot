function errorHandler(error) {
    console.error('An error occurred:', error);

    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '../errors.log');
    const errorMessage = `[${new Date().toISOString()}] ERROR: ${error.stack || error}\n`;

    fs.appendFile(logPath, errorMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

module.exports = { errorHandler };
