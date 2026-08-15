const { computeCpuPercent, computeMemory } = require('./cpuStats');

describe('computeCpuPercent', () => {
  it('computes percent CPU usage from delta counters', () => {
    const stats = {
      cpu_stats: {
        cpu_usage: { total_usage: 2000000000 },
        system_cpu_usage: 20000000000,
        online_cpus: 4,
      },
      precpu_stats: {
        cpu_usage: { total_usage: 1000000000 },
        system_cpu_usage: 15000000000,
      },
    };
    // cpuDelta=1e9, systemDelta=5e9, onlineCpus=4 => (1e9/5e9)*4*100 = 80
    expect(computeCpuPercent(stats)).toBeCloseTo(80);
  });

  it('returns 0 when there is no system delta', () => {
    const stats = {
      cpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 100 },
      precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 100 },
    };
    expect(computeCpuPercent(stats)).toBe(0);
  });

  it('falls back to percpu_usage length when online_cpus is absent', () => {
    const stats = {
      cpu_stats: {
        cpu_usage: { total_usage: 2000000000, percpu_usage: [1, 2] },
        system_cpu_usage: 20000000000,
      },
      precpu_stats: {
        cpu_usage: { total_usage: 1000000000 },
        system_cpu_usage: 15000000000,
      },
    };
    expect(computeCpuPercent(stats)).toBeCloseTo(40);
  });
});

describe('computeMemory', () => {
  it('subtracts cache from usage and computes percent', () => {
    const stats = {
      memory_stats: {
        usage: 1000,
        limit: 10000,
        stats: { inactive_file: 200 },
      },
    };
    const result = computeMemory(stats);
    expect(result.usageBytes).toBe(800);
    expect(result.limitBytes).toBe(10000);
    expect(result.percent).toBeCloseTo(8);
  });

  it('handles missing limit without dividing by zero', () => {
    const stats = { memory_stats: { usage: 500, limit: 0, stats: {} } };
    const result = computeMemory(stats);
    expect(result.percent).toBe(0);
  });
});
