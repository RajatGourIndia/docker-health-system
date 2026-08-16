const path = require('path');
const { readJson, writeJson } = require('./jsonStore');
const config = require('../config/env');

const DEFAULTS = {
  pollIntervalSeconds: 8,
  idleTimeoutMinutes: config.auth.idleTimeoutMinutes,
};

function filePath() {
  return path.join(config.dataDir, 'settings.json');
}

function getSettings() {
  return { ...DEFAULTS, ...readJson(filePath(), {}) };
}

function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  writeJson(filePath(), next);
  return next;
}

module.exports = { getSettings, saveSettings, DEFAULTS };
