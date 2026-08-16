const config = require('../config/env');
const settingsStore = require('../storage/settingsStore');

function currentIdleTimeoutMs() {
  const { idleTimeoutMinutes } = settingsStore.getSettings();
  return (idleTimeoutMinutes || config.auth.idleTimeoutMinutes) * 60 * 1000;
}

function idleTimeout(req, res, next) {
  if (!req.session?.authenticated) {
    return next();
  }

  const lastActivity = req.session.lastActivity || 0;
  if (Date.now() - lastActivity > currentIdleTimeoutMs()) {
    return req.session.destroy(() => {
      res.status(401).json({ error: 'session expired' });
    });
  }

  req.session.lastActivity = Date.now();
  next();
}

module.exports = { idleTimeout, currentIdleTimeoutMs };
