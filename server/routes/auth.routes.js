const express = require('express');
const authService = require('../services/authService');
const { currentIdleTimeoutMs } = require('../middleware/idleTimeout');

const router = express.Router();

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

router.get('/me', (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'authentication required' });
  }
  res.json({
    username: req.session.username,
    expiresAt: new Date(req.session.lastActivity + currentIdleTimeoutMs()).toISOString(),
  });
});

module.exports = router;
