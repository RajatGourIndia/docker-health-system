import { useState } from 'react';
import { containersApi } from '../api/client';
import type { ContainerAction, ContainerSummary } from '../api/types';

interface ContainerActionsProps {
  container: ContainerSummary;
  onOpenLogs: (container: ContainerSummary) => void;
}

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

export function ContainerActions({ container, onOpenLogs }: ContainerActionsProps) {
  const [pending, setPending] = useState<ContainerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: ContainerAction) {
    setPending(action);
    setError(null);
    try {
      await containersApi.action(container.id, action);
      // No local state mutation here — the Docker event over SSE is the
      // source of truth and will update the row once the action lands.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
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
