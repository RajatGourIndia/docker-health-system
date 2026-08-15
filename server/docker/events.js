const { EventEmitter } = require('events');
const { getDocker } = require('./client');
const { toSummaryFromInspect } = require('./containers');

const dockerEventBus = new EventEmitter();
dockerEventBus.setMaxListeners(0);

const RECONNECT_DELAY_MS = 2000;

async function buildEventPayload(rawEvent) {
  const docker = getDocker();
  let container = null;

  // A "destroy" event means the container is gone; inspecting it would just 404.
  if (rawEvent.Action !== 'destroy') {
    try {
      const data = await docker.getContainer(rawEvent.id).inspect();
      container = toSummaryFromInspect(data);
    } catch (err) {
      container = null;
    }
  }

  return {
    id: rawEvent.id,
    action: rawEvent.Action,
    status: rawEvent.status,
    container,
  };
}

async function subscribeToDockerEvents() {
  const docker = getDocker();

  let stream;
  try {
    stream = await docker.getEvents({ filters: JSON.stringify({ type: ['container'] }) });
  } catch (err) {
    console.error('[docker-events] failed to subscribe, retrying:', err.message);
    setTimeout(subscribeToDockerEvents, RECONNECT_DELAY_MS);
    return;
  }

  console.log('[docker-events] subscribed to Docker events stream');

  stream.on('data', async (chunk) => {
    let rawEvent;
    try {
      rawEvent = JSON.parse(chunk.toString('utf8'));
    } catch (err) {
      return;
    }
    try {
      const payload = await buildEventPayload(rawEvent);
      dockerEventBus.emit('container-event', payload);
    } catch (err) {
      console.error('[docker-events] failed to build event payload:', err.message);
    }
  });

  stream.on('error', (err) => {
    console.error('[docker-events] stream error, reconnecting:', err.message);
    setTimeout(subscribeToDockerEvents, RECONNECT_DELAY_MS);
  });

  stream.on('end', () => {
    console.warn('[docker-events] stream ended, reconnecting');
    setTimeout(subscribeToDockerEvents, RECONNECT_DELAY_MS);
  });
}

module.exports = { dockerEventBus, subscribeToDockerEvents };
