import { useEffect, useState } from 'react';
import type { ContainerStats } from '../api/types';

/**
 * Subscribes to /api/containers/:id/stats while `enabled` is true (i.e. the
 * row is visible and the container is running). Each mounted row owns its
 * own EventSource; the backend's stats multiplexer shares the underlying
 * Docker stream across them, so this stays cheap even with many rows open.
 */
export function useContainerStats(id: string, enabled: boolean): ContainerStats | null {
  const [stats, setStats] = useState<ContainerStats | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStats(null);
      return;
    }

    const source = new EventSource(`/api/containers/${id}/stats`, { withCredentials: true });

    source.addEventListener('stats', (evt) => {
      setStats(JSON.parse((evt as MessageEvent).data) as ContainerStats);
    });

    source.addEventListener('stats-ended', () => {
      source.close();
    });

    return () => source.close();
  }, [id, enabled]);

  return stats;
}
