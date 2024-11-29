const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
    level: 'error',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'errors.log' }), // Logs errors to a file
    ],
});

/**
 * Handles errors emitted by the client or shards.
 * Logs the error and prevents the bot from crashing.
 * @param {Error} error - The error to handle
 */
function errorHandler(error) {
    logger.error({ message: error.message, stack: error.stack });
}

module.exports = { errorHandler };
