const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const { requireAuth } = require('./middleware/auth');
const { idleTimeout } = require('./middleware/idleTimeout');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const containersRoutes = require('./routes/containers.routes');
const imagesRoutes = require('./routes/images.routes');
const logsRoutes = require('./routes/logs.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  if (config.cors.allowedOrigin) {
    app.use(cors({ origin: config.cors.allowedOrigin, credentials: true }));
  }
  app.use(express.json());
  app.use(
    session({
      name: 'dashboard.sid',
      secret: config.auth.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.auth.cookieSecure,
        maxAge: config.auth.idleTimeoutMinutes * 60 * 1000,
      },
    })
  );

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);

  app.use('/api', requireAuth, idleTimeout);
  app.use('/api/containers', containersRoutes);
  app.use('/api/containers', logsRoutes);
  app.use('/api/images', imagesRoutes);

  // In production the frontend is a static build served from the same origin
  // as the API, so the browser only ever talks to one host/port. In dev the
  // frontend runs on its own Vite server and proxies /api here instead, so
  // this block is a no-op until `npm run build` produces web/dist.
  const clientDist = path.join(__dirname, '..', 'web', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/).*/, (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
