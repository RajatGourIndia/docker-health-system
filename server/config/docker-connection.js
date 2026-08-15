const fs = require('fs');
const path = require('path');
const Docker = require('dockerode');
const config = require('./env');

class DockerConnectionError extends Error {
  constructor(message, attempted) {
    super(message);
    this.name = 'DockerConnectionError';
    this.attempted = attempted;
  }
}

function tlsOptionsFromEnv() {
  if (!config.docker.tlsVerify || !config.docker.certPath) return {};
  const certPath = config.docker.certPath;
  return {
    ca: fs.readFileSync(path.join(certPath, 'ca.pem')),
    cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
    key: fs.readFileSync(path.join(certPath, 'key.pem')),
  };
}

function optionsFromDockerHostUrl(dockerHost) {
  if (dockerHost.startsWith('unix://')) {
    return { socketPath: dockerHost.replace('unix://', '') };
  }
  if (dockerHost.startsWith('npipe://')) {
    return { socketPath: dockerHost.replace('npipe://', '') };
  }
  const url = new URL(dockerHost.replace('tcp://', 'http://'));
  const tls = tlsOptionsFromEnv();
  return {
    host: url.hostname,
    port: Number(url.port) || 2375,
    protocol: Object.keys(tls).length ? 'https' : 'http',
    ...tls,
  };
}

function describeOptions(options) {
  if (options.socketPath) return `socket ${options.socketPath}`;
  return `${options.protocol}://${options.host}:${options.port}`;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function buildCandidates() {
  const candidates = [];

  if (config.docker.host) {
    candidates.push(optionsFromDockerHostUrl(config.docker.host));
    return candidates;
  }

  candidates.push(
    process.platform === 'win32'
      ? { socketPath: '//./pipe/docker_engine' }
      : { socketPath: '/var/run/docker.sock' }
  );

  if (config.docker.tcpHost) {
    candidates.push({
      host: config.docker.tcpHost,
      port: config.docker.tcpPort,
      protocol: config.docker.tcpProtocol,
    });
  }

  return candidates;
}

async function detectDockerConnection() {
  const candidates = buildCandidates();
  const attempted = [];

  for (const options of candidates) {
    const docker = new Docker(options);
    try {
      await withTimeout(docker.ping(), 3000);
      return { docker, connectionInfo: describeOptions(options) };
    } catch (err) {
      attempted.push({ options: describeOptions(options), error: err.message });
    }
  }

  throw new DockerConnectionError(
    'Could not reach the Docker daemon. Is Docker running? If this dashboard itself is ' +
      'containerized, mount the Docker socket (e.g. -v /var/run/docker.sock:/var/run/docker.sock) ' +
      'or set DOCKER_HOST / DOCKER_TCP_HOST.',
    attempted
  );
}

module.exports = { detectDockerConnection, DockerConnectionError };
