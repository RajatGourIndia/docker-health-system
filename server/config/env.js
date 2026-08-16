const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const { readJson, writeJson } = require('../storage/jsonStore');

const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '..', '..', 'data');

// Signs the session cookie. Rather than making every user generate and
// paste one before first boot, an explicit SESSION_SECRET in .env still
// wins (e.g. to pin it across multiple instances that must share
// sessions), but otherwise one is generated once and persisted in DATA_DIR
// — the same volume the admin account already lives in — so a normal
// single-instance setup needs zero manual secret handling.
function resolveSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim()) {
    return process.env.SESSION_SECRET.trim();
  }

  const secretPath = path.join(dataDir, 'session-secret.json');
  const stored = readJson(secretPath, null);
  if (stored?.secret) {
    return stored.secret;
  }

  const generated = crypto.randomBytes(32).toString('hex');
  writeJson(secretPath, { secret: generated });
  return generated;
}

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Where the admin account, settings, and the auto-generated session
  // secret are persisted (JSON files). Mount this as a volume in
  // production, or all three are lost on every container recreate.
  dataDir,

  auth: {
    sessionSecret: resolveSessionSecret(),
    idleTimeoutMinutes: Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES) || 30,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },

  cors: {
    allowedOrigin: (() => {
      const origin = process.env.ALLOWED_ORIGIN || null;
      if (origin === '*') {
        throw new Error(
          'Refusing to start: ALLOWED_ORIGIN cannot be "*" — this app sends session cookies ' +
            '(credentials: true), and a wildcard origin combined with credentials lets any site ' +
            'read authenticated responses. Set ALLOWED_ORIGIN to the exact frontend origin.'
        );
      }
      return origin;
    })(),
  },

  docker: {
    host: process.env.DOCKER_HOST || null,
    tlsVerify: process.env.DOCKER_TLS_VERIFY === '1',
    certPath: process.env.DOCKER_CERT_PATH || null,
    tcpHost: process.env.DOCKER_TCP_HOST || null,
    tcpPort: Number(process.env.DOCKER_TCP_PORT) || 2375,
    tcpProtocol: process.env.DOCKER_TCP_PROTOCOL || 'http',
  },
};

module.exports = config;
