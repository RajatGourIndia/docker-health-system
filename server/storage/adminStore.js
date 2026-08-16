const path = require('path');
const { readJson, writeJson } = require('./jsonStore');
const config = require('../config/env');

function filePath() {
  return path.join(config.dataDir, 'admin.json');
}

function getAdmin() {
  return readJson(filePath(), null);
}

function saveAdmin(admin) {
  writeJson(filePath(), admin);
}

module.exports = { getAdmin, saveAdmin };
