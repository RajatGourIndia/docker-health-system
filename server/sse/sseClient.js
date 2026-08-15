const HEARTBEAT_INTERVAL_MS = 15000;

function createSseClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let closed = false;

  function write(event, data) {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  const heartbeat = setInterval(() => {
    if (closed) return;
    res.write(': ping\n\n');
  }, HEARTBEAT_INTERVAL_MS);

  function close(cleanupFn) {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    if (cleanupFn) cleanupFn();
    res.end();
  }

  req.on('close', () => {
    closed = true;
    clearInterval(heartbeat);
  });

  return { write, close };
}

module.exports = { createSseClient };
