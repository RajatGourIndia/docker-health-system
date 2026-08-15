import { useState } from 'react';
import { containersApi } from '../api/client';
import type { ContainerAction, ContainerSummary } from '../api/types';

interface ContainerActionsProps {
  container: ContainerSummary;
  onOpenLogs: (container: ContainerSummary) => void;
  onPatch: (id: string, patch: Partial<ContainerSummary>) => void;
}

const RESULTING_STATE: Record<ContainerAction, ContainerSummary['state']> = {
  start: 'running',
  restart: 'running',
  pause: 'paused',
  unpause: 'running',
  stop: 'exited',
};

function actionsForState(state: string): ContainerAction[] {
  switch (state) {
    case 'running':
      return ['pause', 'restart', 'stop'];
    case 'paused':
      return ['unpause', 'stop'];
    case 'restarting':
      return [];
    default:
      return ['start'];
  }
}

const ACTION_LABELS: Record<ContainerAction, string> = {
  start: 'Start',
  stop: 'Stop',
  restart: 'Restart',
  pause: 'Pause',
  unpause: 'Resume',
};

const ERROR_DISPLAY_MS = 4000;

function friendlyError(err: unknown): string {
  if (err instanceof Error && /already/i.test(err.message)) {
    return 'Already in that state — the list may be a step behind, refresh if this repeats.';
  }
  return err instanceof Error ? err.message : 'Action failed';
}

export function ContainerActions({ container, onOpenLogs, onPatch }: ContainerActionsProps) {
  const [pending, setPending] = useState<ContainerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: ContainerAction) {
    setPending(action);
    setError(null);
    try {
      await containersApi.action(container.id, action);
      // The action endpoint only responds once Docker has made the change,
      // so it's safe to reflect it immediately rather than wait for the SSE
      // event (which still arrives and reconciles any remaining fields).
      onPatch(container.id, { state: RESULTING_STATE[action] });
    } catch (err) {
      setError(friendlyError(err));
      setTimeout(() => setError(null), ERROR_DISPLAY_MS);
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="btn-row">
        {actionsForState(container.state).map((action) => (
          <button
            key={action}
            className={`btn ${action === 'stop' ? 'btn--danger' : ''}`}
            disabled={pending !== null}
            onClick={() => run(action)}
          >
            {pending === action ? '…' : ACTION_LABELS[action]}
          </button>
        ))}
        <button className="btn btn--ghost" onClick={() => onOpenLogs(container)}>
          Logs
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
