const express = require('express');
const authService = require('../services/authService');
const settingsStore = require('../storage/settingsStore');
const { getDocker } = require('../docker/client');

const router = express.Router();
const startedAt = Date.now();

router.post('/change-password', async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match' });
  }

  try {
    await authService.changePassword(currentPassword, newPassword);
    res.status(204).end();
  } catch (err) {
    if (err instanceof authService.AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/settings', (req, res) => {
  res.json(settingsStore.getSettings());
});

router.put('/settings', (req, res) => {
  const { pollIntervalSeconds, idleTimeoutMinutes } = req.body || {};
  const patch = {};

  if (pollIntervalSeconds !== undefined) {
    const n = Number(pollIntervalSeconds);
    if (!Number.isFinite(n) || n < 3 || n > 300) {
      return res.status(400).json({ error: 'pollIntervalSeconds must be between 3 and 300' });
    }
    patch.pollIntervalSeconds = n;
  }

  if (idleTimeoutMinutes !== undefined) {
    const n = Number(idleTimeoutMinutes);
    if (!Number.isFinite(n) || n < 1 || n > 1440) {
      return res.status(400).json({ error: 'idleTimeoutMinutes must be between 1 and 1440' });
    }
    patch.idleTimeoutMinutes = n;
  }

  res.json(settingsStore.saveSettings(patch));
});

router.get('/system-info', async (req, res, next) => {
  try {
    const version = await getDocker().version();
    res.json({
      dockerVersion: version.Version,
      apiVersion: version.ApiVersion,
      os: version.Os,
      arch: version.Arch,
      dashboardUptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
