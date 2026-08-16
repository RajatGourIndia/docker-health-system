const express = require('express');
const authService = require('../services/authService');

const router = express.Router();

// Public — the frontend checks this before rendering the login screen, to
// decide whether to show the first-run "Create Admin Account" screen instead.
router.get('/status', (req, res) => {
  res.json({ hasAdmin: authService.hasAdmin() });
});

router.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    await authService.createAdmin(username, password);
    res.status(204).end();
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
