const { detectDockerConnection } = require('../config/docker-connection');

let dockerInstance = null;
let connectionInfo = null;

async function initDockerClient() {
  const result = await detectDockerConnection();
  dockerInstance = result.docker;
  connectionInfo = result.connectionInfo;
  return result;
}

function getDocker() {
  if (!dockerInstance) {
    throw new Error('Docker client not initialized. Call initDockerClient() at startup first.');
  }
  return dockerInstance;
}

function getConnectionInfo() {
  return connectionInfo;
}

module.exports = { initDockerClient, getDocker, getConnectionInfo };
