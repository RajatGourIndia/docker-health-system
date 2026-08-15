function computeCpuPercent(stats) {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const onlineCpus =
    stats.cpu_stats.online_cpus || (stats.cpu_stats.cpu_usage.percpu_usage || []).length || 1;

  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * onlineCpus * 100;
  }
  return 0;
}

function computeMemory(stats) {
  const memStats = stats.memory_stats.stats || {};
  const cache = memStats.inactive_file ?? memStats.cache ?? 0;
  const usageBytes = (stats.memory_stats.usage || 0) - cache;
  const limitBytes = stats.memory_stats.limit || 0;
  return {
    usageBytes,
    limitBytes,
    percent: limitBytes ? (usageBytes / limitBytes) * 100 : 0,
  };
}

module.exports = { computeCpuPercent, computeMemory };
