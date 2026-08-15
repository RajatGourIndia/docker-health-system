const { getDocker } = require('./client');

class ContainerActionError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'ContainerActionError';
    this.statusCode = statusCode;
  }
}

function mapPorts(ports) {
  return (ports || []).map((p) => ({
    privatePort: p.PrivatePort,
    publicPort: p.PublicPort || null,
    type: p.Type,
    ip: p.IP || null,
  }));
}

function toSummary(container) {
  return {
    id: container.Id,
    name: (container.Names?.[0] || '').replace(/^\//, ''),
    image: container.Image,
    state: container.State,
    status: container.Status,
    ports: mapPorts(container.Ports),
    createdAt: new Date(container.Created * 1000).toISOString(),
  };
}

async function listContainers(all = true) {
  const docker = getDocker();
  const containers = await docker.listContainers({ all });
  return containers.map(toSummary);
}

function mapPortsFromInspect(networkSettingsPorts) {
  return mapPorts(
    Object.entries(networkSettingsPorts || {}).flatMap(([key, bindings]) => {
      const [privatePort, type] = key.split('/');
      if (!bindings) return [];
      return bindings.map((b) => ({
        PrivatePort: Number(privatePort),
        PublicPort: b.HostPort ? Number(b.HostPort) : null,
        Type: type,
        IP: b.HostIp,
      }));
    })
  );
}

// Shapes a single `inspect()` payload into the same summary used by listContainers,
// so single-container lookups (e.g. from a Docker event) don't require a full list scan.
function toSummaryFromInspect(data) {
  return {
    id: data.Id,
    name: (data.Name || '').replace(/^\//, ''),
    image: data.Config?.Image,
    state: data.State?.Status,
    status: data.State?.Status,
    ports: mapPortsFromInspect(data.NetworkSettings?.Ports),
    createdAt: data.Created,
  };
}

async function inspectContainer(id) {
  const docker = getDocker();
  const container = docker.getContainer(id);
  const data = await handleNotFound(() => container.inspect(), id);

  return {
    id: data.Id,
    name: data.Name.replace(/^\//, ''),
    image: data.Config.Image,
    state: data.State.Status,
    status: data.State.Status,
    createdAt: data.Created,
    env: data.Config.Env || [],
    mounts: data.Mounts || [],
    restartPolicy: data.HostConfig?.RestartPolicy || null,
    ports: mapPortsFromInspect(data.NetworkSettings?.Ports),
  };
}

async function handleNotFound(fn, id) {
  try {
    return await fn();
  } catch (err) {
    if (err.statusCode === 404) {
      throw new ContainerActionError(`Container ${id} not found`, 404);
    }
    if (err.statusCode === 304) {
      throw new ContainerActionError('Container already in the requested state', 409);
    }
    throw err;
  }
}

function actionOn(id, method) {
  const docker = getDocker();
  const container = docker.getContainer(id);
  return handleNotFound(() => container[method](), id);
}

const startContainer = (id) => actionOn(id, 'start');
const stopContainer = (id) => actionOn(id, 'stop');
const restartContainer = (id) => actionOn(id, 'restart');
const pauseContainer = (id) => actionOn(id, 'pause');
const unpauseContainer = (id) => actionOn(id, 'unpause');

module.exports = {
  ContainerActionError,
  listContainers,
  toSummaryFromInspect,
  inspectContainer,
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
};
