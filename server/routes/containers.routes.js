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

// One shared connection for the CURRENTLY VISIBLE containers' live stats
// (the ids the client asks for via ?ids=), instead of the browser opening
// one connection per row (browsers cap concurrent connections per origin —
// 6 on HTTP/1.1 — which starves everything else once a page has 15-20+
// rows) and instead of the backend eagerly streaming every running
// container regardless of what's on screen. That second approach is worse
// than it sounds: each subscription is a real, continuous stats stream the
// Docker daemon has to keep computing, so unconditionally streaming an
// entire fleet (tens to hundreds of containers) drives sustained daemon and
// host CPU load far beyond what's actually being looked at. Scoping to
// exactly the visible page/search-result ids bounds concurrent stats
// streams to page size, regardless of how many containers exist in total.
// Registered before /:id/stats and /:id so "stats" isn't captured as an id.
router.get('/stats', (req, res) => {
  const sse = createSseClient(req, res);

  const requestedIds = String(req.query.ids || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const unsubscribes = requestedIds.map((id) => {
    const onStats = (data) => sse.write('stats', { containerId: id, ...data });
    // Also fires for a requested id that isn't running / doesn't exist —
    // the client just treats it as "no stats for this one right now".
    const onEnded = (data) => sse.write('stats-ended', { containerId: id, ...data });
    return subscribeToContainerStats(id, onStats, onEnded);
  });

  req.on('close', () => {
    for (const unsubscribe of unsubscribes) unsubscribe();
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
