import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { ContainerEvent, ContainerSummary } from '../api/types';

interface ContainerEventsState {
  containers: ContainerSummary[];
  /** null while the initial snapshot hasn't arrived yet */
  loaded: boolean;
  connectionError: string | null;
}

interface ContainerEventsResult extends ContainerEventsState {
  /**
   * Applies a known state change immediately instead of waiting for the SSE
   * event to round-trip — the action endpoints only respond once Docker has
   * already made the change, so this is never speculative.
   */
  patchContainer: (id: string, patch: Partial<ContainerSummary>) => void;
}

function patchState(
  containers: ContainerSummary[],
  id: string,
  patch: Partial<ContainerSummary>
): ContainerSummary[] {
  return containers.map((c) => (c.id === id ? { ...c, ...patch } : c));
}

function applyEvent(containers: ContainerSummary[], event: ContainerEvent): ContainerSummary[] {
  const withoutTarget = containers.filter((c) => c.id !== event.id);
  if (event.action === 'destroy' || !event.container) {
    return withoutTarget;
  }
  return [...withoutTarget, event.container].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Subscribes to /api/containers/events (SSE): one snapshot, then incremental
 * container-event deltas for the lifetime of the connection.
 */
export function useContainerEvents(): ContainerEventsResult {
  const { handleUnauthorized } = useAuth();
  const [state, setState] = useState<ContainerEventsState>({
    containers: [],
    loaded: false,
    connectionError: null,
  });
  const handleUnauthorizedRef = useRef(handleUnauthorized);
  handleUnauthorizedRef.current = handleUnauthorized;

  useEffect(() => {
    const source = new EventSource('/api/containers/events', { withCredentials: true });

    source.addEventListener('snapshot', (evt) => {
      const containers = JSON.parse((evt as MessageEvent).data) as ContainerSummary[];
      setState({
        containers: [...containers].sort((a, b) => a.name.localeCompare(b.name)),
        loaded: true,
        connectionError: null,
      });
    });

    source.addEventListener('container-event', (evt) => {
      const payload = JSON.parse((evt as MessageEvent).data) as ContainerEvent;
      setState((prev) => ({ ...prev, containers: applyEvent(prev.containers, payload) }));
    });

    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) {
        // The server rejected the connection outright (e.g. session expired) —
        // the browser will not retry a closed EventSource, so treat it as logged out.
        handleUnauthorizedRef.current();
        return;
      }
      setState((prev) => ({ ...prev, connectionError: 'Reconnecting to live updates…' }));
    });

    source.addEventListener('open', () => {
      setState((prev) => ({ ...prev, connectionError: null }));
    });

    return () => source.close();
  }, []);

  const patchContainer = useCallback((id: string, patch: Partial<ContainerSummary>) => {
    setState((prev) => ({ ...prev, containers: patchState(prev.containers, id, patch) }));
  }, []);

  return { ...state, patchContainer };
}
