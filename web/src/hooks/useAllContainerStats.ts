import { useEffect, useMemo, useState } from 'react';
import type { ContainerStats } from '../api/types';

interface TaggedStats extends ContainerStats {
  containerId: string;
}

/**
 * One shared SSE connection for exactly the given container ids (the
 * currently visible page/search results), instead of each row opening its
 * own connection AND instead of streaming every running container
 * regardless of what's on screen. Both of those scale badly: per-row
 * connections exhaust the browser's per-origin connection limit (6 on
 * HTTP/1.1) once a page has 15-20+ rows; streaming the entire fleet puts
 * sustained load on the Docker daemon proportional to total container
 * count instead of what's actually visible. Scoping to `containerIds`
 * bounds concurrent stats streams to page size, regardless of how many
 * containers exist. Reconnects only when the actual id set changes (not on
 * every render, and not on reordering) — e.g. changing page or search.
 */
export function useAllContainerStats(containerIds: string[]): Map<string, ContainerStats> {
  const [statsById, setStatsById] = useState<Map<string, ContainerStats>>(new Map());

  // Stable primitive key so the effect only re-runs when the SET of ids
  // actually changes, not on every render (a new array reference each
  // render would otherwise reconnect constantly).
  const idsKey = useMemo(() => [...containerIds].sort().join(','), [containerIds]);

  useEffect(() => {
    // Nothing visible (e.g. empty search results) — no connection needed.
    if (!idsKey) {
      setStatsById(new Map());
      return;
    }

    const source = new EventSource(`/api/containers/stats?ids=${encodeURIComponent(idsKey)}`, {
      withCredentials: true,
    });

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
  }, [idsKey]);

  return statsById;
}
