import type { ContainerState } from '../api/types';

const LABELS: Record<string, string> = {
  running: 'Running',
  exited: 'Exited',
  paused: 'Paused',
  restarting: 'Restarting',
  dead: 'Dead',
  created: 'Created',
};

export function StatusBadge({ state }: { state: ContainerState }) {
  const key = LABELS[state] ? state : 'exited';
  return (
    <span className={`status-badge status-badge--${key}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {LABELS[key] ?? state}
    </span>
  );
}
