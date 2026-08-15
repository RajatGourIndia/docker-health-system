const config = require('../config/env');

const idleTimeoutMs = config.auth.idleTimeoutMinutes * 60 * 1000;

function idleTimeout(req, res, next) {
  if (!req.session?.authenticated) {
    return next();
  }

  const lastActivity = req.session.lastActivity || 0;
  if (Date.now() - lastActivity > idleTimeoutMs) {
    return req.session.destroy(() => {
      res.status(401).json({ error: 'session expired' });
    });
  }

  req.session.lastActivity = Date.now();
  next();
}

module.exports = { idleTimeout };
