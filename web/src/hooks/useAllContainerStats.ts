import { useEffect, useState } from 'react';
import type { ContainerStats } from '../api/types';

interface TaggedStats extends ContainerStats {
  containerId: string;
}

/**
 * One shared SSE connection for every running container's stats, instead of
 * each row opening its own. Browsers cap concurrent connections per origin
 * (6 on HTTP/1.1) — with many rows each holding a persistent connection
 * open, that cap gets exhausted and starves everything else sharing it
 * (the main container-events stream, action requests, the logs stream).
 * A single shared stream keeps total connections constant regardless of
 * how many containers exist.
 */
export function useAllContainerStats(): Map<string, ContainerStats> {
  const [statsById, setStatsById] = useState<Map<string, ContainerStats>>(new Map());

  useEffect(() => {
    const source = new EventSource('/api/containers/stats', { withCredentials: true });

    source.addEventListener('stats', (evt) => {
      const { containerId, ...stats } = JSON.parse((evt as MessageEvent).data) as TaggedStats;
      setStatsById((prev) => {
        const next = new Map(prev);
        next.set(containerId, stats);
        return next;
      });
    });

    source.addEventListener('stats-ended', (evt) => {
      const { containerId } = JSON.parse((evt as MessageEvent).data) as { containerId: string };
      setStatsById((prev) => {
        if (!prev.has(containerId)) return prev;
        const next = new Map(prev);
        next.delete(containerId);
        return next;
      });
    });

    return () => source.close();
  }, []);

  return statsById;
}
