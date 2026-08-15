const express = require('express');
const { getLogTail, streamLogs, getRawLogStream, demux } = require('../docker/logs');
const { inspectContainer } = require('../docker/containers');
const { createSseClient } = require('../sse/sseClient');

const router = express.Router();

router.get('/:id/logs', async (req, res, next) => {
  const follow = req.query.follow === 'true';
  const tail = Number(req.query.tail) || 200;

  if (!follow) {
    try {
      const lines = await getLogTail(req.params.id, tail);
      return res.json({ lines });
    } catch (err) {
      return next(err);
    }
  }

  const sse = createSseClient(req, res);
  let dockerStream;

  try {
    dockerStream = await streamLogs(req.params.id, {
      tail,
      onLine: (line) => sse.write('log', line),
    });
  } catch (err) {
    sse.write('error', { error: err.message });
    sse.close();
    return;
  }

  req.on('close', () => {
    dockerStream.destroy();
  });
});

router.get('/:id/logs/download', async (req, res, next) => {
  try {
    const { since, until } = req.query;
    const buffer = await getRawLogStream(req.params.id, { since, until });
    const text = demux(buffer);
    const detail = await inspectContainer(req.params.id).catch(() => null);
    const name = detail?.name || req.params.id;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${name}-logs-${timestamp}.txt"`
    );
    res.send(text);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
