const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../errors.log');

function logError(message, error) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}: ${error}\n`;

    fs.appendFileSync(logFile, logMessage);
    console.error(message, error);
}

module.exports = { logError };
