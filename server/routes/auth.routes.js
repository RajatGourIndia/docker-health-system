const express = require('express');
const authService = require('../services/authService');
const { currentIdleTimeoutMs } = require('../middleware/idleTimeout');

const router = express.Router();

// /api/auth/* is mounted ahead of the global requireAuth+idleTimeout chain
// (login has to work before any session exists), so any route here that
// touches an existing session must re-check expiry itself — otherwise it'd
// be a backdoor around idle timeout.
function isExpired(req) {
  const lastActivity = req.session.lastActivity || 0;
  return Date.now() - lastActivity > currentIdleTimeoutMs();
}

function expireSession(req, res) {
  return req.session.destroy(() => {
    res.status(401).json({ error: 'session expired' });
  });
}

router.post('/login', async (req, res, next) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  try {
    const resolvedUsername = await authService.verifyLogin(username, password);
    req.session.authenticated = true;
    req.session.username = resolvedUsername;
    req.session.lastActivity = Date.now();
    res.json({ username: resolvedUsername });
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

// Called by the frontend only on real user interaction (mouse/keyboard/
// touch/scroll), throttled client-side — this is the sole thing that
// refreshes lastActivity, so idle timeout reflects actual user presence
// rather than incidental background API traffic.
router.post('/touch', (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'authentication required' });
  }
  if (isExpired(req)) {
    return expireSession(req, res);
  }
  req.session.lastActivity = Date.now();
  res.status(204).end();
});

router.get('/me', (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'authentication required' });
  }
  if (isExpired(req)) {
    return expireSession(req, res);
  }
  res.json({
    username: req.session.username,
    expiresAt: new Date(req.session.lastActivity + currentIdleTimeoutMs()).toISOString(),
  });
});

module.exports = router;
