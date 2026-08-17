const express = require('express');
const {
  listContainers,
  inspectContainer,
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
} = require('../docker/containers');
const { dockerEventBus } = require('../docker/events');
const { subscribeToContainerStats } = require('../docker/stats-multiplexer');
const { createSseClient } = require('../sse/sseClient');

const router = express.Router();

router.get('/events', async (req, res) => {
  const sse = createSseClient(req, res);

  try {
    const snapshot = await listContainers(true);
    sse.write('snapshot', snapshot);
  } catch (err) {
    sse.write('error', { error: err.message });
  }

  const onEvent = (payload) => sse.write('container-event', payload);
  dockerEventBus.on('container-event', onEvent);

  req.on('close', () => {
    dockerEventBus.off('container-event', onEvent);
  });
});

router.get('/', async (req, res, next) => {
  try {
    const all = req.query.all !== 'false';
    const containers = await listContainers(all);
    res.json(containers);
  } catch (err) {
    next(err);
  }
});

// One shared connection for every running container's live stats, instead
// of the browser opening one per row. Browsers cap concurrent connections
// per origin (6 on HTTP/1.1) — a paginated list opening 15-20+ individual
// stats streams exhausts that cap and starves everything else sharing it
// (the main container-events stream, action requests, the logs stream),
// which is what caused status updates and Logs to silently stop working on
// anything but a single-row filtered view. This endpoint keeps total
// persistent connections constant regardless of how many containers exist.
// Registered before /:id/stats and /:id so "stats" isn't captured as an id.
router.get('/stats', async (req, res) => {
  const sse = createSseClient(req, res);
  const unsubscribes = new Map();

  function subscribe(id) {
    const onStats = (data) => sse.write('stats', { containerId: id, ...data });
    const onEnded = () => {
      unsubscribes.get(id)?.();
      unsubscribes.delete(id);
      sse.write('stats-ended', { containerId: id });
    };
    unsubscribes.set(id, subscribeToContainerStats(id, onStats, onEnded));
  }

  async function sync() {
    let containers;
    try {
      containers = await listContainers(false); // running only
    } catch (err) {
      return;
    }
    const runningIds = new Set(containers.map((c) => c.id));

    for (const id of runningIds) {
      if (!unsubscribes.has(id)) subscribe(id);
    }
    for (const id of unsubscribes.keys()) {
      if (!runningIds.has(id)) {
        unsubscribes.get(id)?.();
        unsubscribes.delete(id);
        sse.write('stats-ended', { containerId: id });
      }
    }
  }

  await sync();
  // Re-sync whenever any container starts/stops/is removed, so the
  // subscription set tracks reality without polling.
  const onEvent = () => sync();
  dockerEventBus.on('container-event', onEvent);

  req.on('close', () => {
    dockerEventBus.off('container-event', onEvent);
    for (const unsubscribe of unsubscribes.values()) unsubscribe();
  });
});

router.get('/:id/stats', (req, res) => {
  const sse = createSseClient(req, res);

  const onStats = (data) => sse.write('stats', data);
  const onEnded = (data) => {
    sse.write('stats-ended', data);
    sse.close();
  };

  const unsubscribe = subscribeToContainerStats(req.params.id, onStats, onEnded);

  req.on('close', () => {
    unsubscribe();
  });
});

router.get('/:id', async (req, res, next) => {
  try {
    const detail = await inspectContainer(req.params.id);
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

function actionRoute(path, action) {
  router.post(path, async (req, res, next) => {
    try {
      await action(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });
}

actionRoute('/:id/start', startContainer);
actionRoute('/:id/stop', stopContainer);
actionRoute('/:id/restart', restartContainer);
actionRoute('/:id/pause', pauseContainer);
actionRoute('/:id/unpause', unpauseContainer);

module.exports = router;
