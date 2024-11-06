// backend/logger/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
// In backend/logger/logger.js
    new winston.transports.File({ filename: 'logs/evidence.log' }),
    new winston.transports.Console() // Logs to console for real-time feedback
  ]
});

module.exports = logger;
