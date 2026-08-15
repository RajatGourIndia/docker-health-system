const { getDocker } = require('./client');

async function listImages() {
  const docker = getDocker();
  const images = await docker.listImages();
  return images.map((img) => ({
    id: img.Id,
    repoTags: img.RepoTags || [],
    size: img.Size,
    createdAt: new Date(img.Created * 1000).toISOString(),
  }));
}

module.exports = { listImages };
