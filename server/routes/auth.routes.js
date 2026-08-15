const express = require('express');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const usernameMatches = username === config.auth.username;
  const passwordMatches = await bcrypt.compare(password, config.auth.passwordHash);

  if (!usernameMatches || !passwordMatches) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  req.session.authenticated = true;
  req.session.username = username;
  req.session.lastActivity = Date.now();

  res.json({ username });
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
  const idleTimeoutMs = config.auth.idleTimeoutMinutes * 60 * 1000;
  res.json({
    username: req.session.username,
    expiresAt: new Date(req.session.lastActivity + idleTimeoutMs).toISOString(),
  });
});

module.exports = router;
