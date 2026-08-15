const { EventEmitter } = require('events');
const { getDocker } = require('./client');
const { computeCpuPercent, computeMemory } = require('../utils/cpuStats');

// containerId -> { emitter, dockerStream, refCount }
const active = new Map();

function startUpstreamStream(containerId) {
  const docker = getDocker();
  const container = docker.getContainer(containerId);
  const emitter = new EventEmitter();
  emitter.setMaxListeners(0);

  const entry = { emitter, dockerStream: null, refCount: 0 };
  active.set(containerId, entry);

  container.stats({ stream: true }, (err, stream) => {
    if (err) {
      emitter.emit('stats-ended', { error: err.message });
      active.delete(containerId);
      return;
    }

    entry.dockerStream = stream;

    stream.on('data', (chunk) => {
      let raw;
      try {
        raw = JSON.parse(chunk.toString('utf8'));
      } catch (e) {
        return;
      }
      if (!raw.cpu_stats || !raw.precpu_stats) return;

      const cpuPercent = computeCpuPercent(raw);
      const mem = computeMemory(raw);
      emitter.emit('stats', {
        cpuPercent,
        memUsageBytes: mem.usageBytes,
        memLimitBytes: mem.limitBytes,
        memPercent: mem.percent,
        timestamp: new Date().toISOString(),
      });
    });

    stream.on('error', (streamErr) => {
      emitter.emit('stats-ended', { error: streamErr.message });
      active.delete(containerId);
    });

    stream.on('end', () => {
      emitter.emit('stats-ended', {});
      active.delete(containerId);
    });
  });

  return entry;
}

function subscribeToContainerStats(containerId, onStats, onEnded) {
  let entry = active.get(containerId);
  if (!entry) {
    entry = startUpstreamStream(containerId);
  }

  entry.refCount += 1;
  entry.emitter.on('stats', onStats);
  entry.emitter.on('stats-ended', onEnded);

  return function unsubscribe() {
    entry.emitter.off('stats', onStats);
    entry.emitter.off('stats-ended', onEnded);
    entry.refCount -= 1;

    if (entry.refCount <= 0) {
      if (entry.dockerStream) {
        entry.dockerStream.destroy();
      }
      active.delete(containerId);
    }
  };
}

module.exports = { subscribeToContainerStats };
