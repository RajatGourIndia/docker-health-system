const { getDocker } = require('./client');

function getContainer(id) {
  return getDocker().getContainer(id);
}

// Docker multiplexes stdout/stderr with an 8-byte header per frame when the
// container was not started with a TTY. Strip those headers so log lines are
// plain text either way.
function demux(chunk) {
  const lines = [];
  let offset = 0;
  while (offset < chunk.length) {
    const header = chunk.slice(offset, offset + 8);
    const isFrameHeader = header.length === 8 && header[0] <= 2;
    if (!isFrameHeader) {
      lines.push(chunk.slice(offset).toString('utf8'));
      break;
    }
    const size = header.readUInt32BE(4);
    const payload = chunk.slice(offset + 8, offset + 8 + size);
    lines.push(payload.toString('utf8'));
    offset += 8 + size;
  }
  return lines.join('');
}

async function getLogTail(id, tail = 200) {
  const container = getContainer(id);
  const buffer = await container.logs({
    stdout: true,
    stderr: true,
    tail,
    timestamps: true,
  });
  return demux(buffer).split('\n').filter(Boolean);
}

async function streamLogs(id, { onLine, tail = 200 }) {
  const container = getContainer(id);
  const stream = await container.logs({
    stdout: true,
    stderr: true,
    follow: true,
    tail,
    timestamps: true,
  });

  stream.on('data', (chunk) => {
    const text = demux(chunk);
    text
      .split('\n')
      .filter(Boolean)
      .forEach((line) => onLine(line));
  });

  return stream;
}

async function getRawLogStream(id, { since, until } = {}) {
  const container = getContainer(id);
  return container.logs({
    stdout: true,
    stderr: true,
    timestamps: true,
    ...(since ? { since } : {}),
    ...(until ? { until } : {}),
  });
}

module.exports = { getLogTail, streamLogs, getRawLogStream, demux };
