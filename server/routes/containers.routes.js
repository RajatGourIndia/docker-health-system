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
