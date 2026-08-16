const config = require('./config/env');
const { createApp } = require('./app');
const { initDockerClient } = require('./docker/client');
const { subscribeToDockerEvents } = require('./docker/events');

async function main() {
  const { connectionInfo } = await initDockerClient();
  console.log(`[docker] connected via ${connectionInfo}`);

  subscribeToDockerEvents();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`docker-health-system listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
