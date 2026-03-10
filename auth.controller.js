const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// ✅ Global reusable SMTP transporter with connection pooling
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "teamtechsign.in",
      port: 465,
      secure: true,
      auth: {
        user: "platform@teamtechsign.in",
        pass: "S.chandru6@"
      },
      pool: {
        maxConnections: 5,      // Reuse connections
        maxMessages: 100,       // Send 100 emails per connection
        rateDelta: 4000,        // Milliseconds between rate limit resets
        rateLimit: true         // Enable rate limiting
      },
      connectionTimeout: 5000,
      socketTimeout: 5000
    });

    // Verify connection on first use
    transporter.verify((err, success) => {
      if (err) {
        logger.error("SMTP connection error: " + err.message);
      } else {
        logger.info("✅ Global SMTP transporter ready");
      }
    });
  }

  return transporter;
}

module.exports = { getTransporter };
