const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Refusing to start: ${name} must be set in .env. See .env.example. ` +
        'No default credentials are provided for security reasons.'
    );
  }
  return value;
}

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  auth: {
    username: required('DASHBOARD_USERNAME'),
    passwordHash: required('DASHBOARD_PASSWORD_HASH'),
    sessionSecret: required('SESSION_SECRET'),
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
