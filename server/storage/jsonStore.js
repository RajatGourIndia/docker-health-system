const fs = require('fs');
const path = require('path');

function readJson(filePath, defaultValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return defaultValue;
    throw err;
  }
}

// Write-to-temp-then-rename so a crash mid-write can never leave a
// truncated/corrupt file behind — rename is atomic on the same filesystem.
function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}

module.exports = { readJson, writeJson };
