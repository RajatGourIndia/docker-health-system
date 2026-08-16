const config = require('../config/env');
const settingsStore = require('../storage/settingsStore');

function currentIdleTimeoutMs() {
  const { idleTimeoutMinutes } = settingsStore.getSettings();
  return (idleTimeoutMinutes || config.auth.idleTimeoutMinutes) * 60 * 1000;
}

// Only CHECKS lastActivity — deliberately does not refresh it on every
// request. If it did, the background reconcile poll and SSE traffic that
// keep the container list live would "touch" the session continuously,
// and idle timeout could never actually trigger no matter how long the
// user has been away from mouse/keyboard. Activity is refreshed only by
// POST /api/auth/touch, which the frontend calls on real user interaction.
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

  next();
}

module.exports = { idleTimeout, currentIdleTimeoutMs };
