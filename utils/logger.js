const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [new transports.Console()],
});

function logError(error, context) {
    logger.error(`${context}: ${error.message}`);
}

module.exports = { logError, logger };
