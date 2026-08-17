import { StatusBadge } from './StatusBadge';
import { Meter } from './Meter';
import { ContainerActions } from './ContainerActions';
import { formatBytes, formatPercent, formatRelativeTime } from '../utils/format';
import type { ContainerStats, ContainerSummary } from '../api/types';

export function ContainerRow({
  container,
  stats,
  onOpenLogs,
  onPatch,
}: {
  container: ContainerSummary;
  stats: ContainerStats | null;
  onOpenLogs: (container: ContainerSummary) => void;
  onPatch: (id: string, patch: Partial<ContainerSummary>) => void;
}) {
  const isRunning = container.state === 'running';

  return (
    <tr>
      <td className="cell-name-cell">
        <div className="cell-name-row">
          <span className="cell-name" title={container.name}>
            {container.name}
          </span>
          {container.isSelf && <span className="tag-pill tag-pill--accent">This app</span>}
        </div>
        <div className="cell-sub" title={container.image}>
          {container.image}
        </div>
      </td>
      <td>
        <StatusBadge state={container.state} />
        <div className="cell-sub">{container.status}</div>
      </td>
      <td>
        {isRunning && stats ? (
          <Meter percent={stats.cpuPercent} label={formatPercent(stats.cpuPercent)} />
        ) : (
          <span className="cell-sub">—</span>
        )}
      </td>
      <td>
        {isRunning && stats ? (
          <Meter
            percent={stats.memPercent}
            label={
              stats.memLimitBytes
                ? `${formatBytes(stats.memUsageBytes)} / ${formatBytes(stats.memLimitBytes)}`
                : formatBytes(stats.memUsageBytes)
            }
          />
        ) : (
          <span className="cell-sub">—</span>
        )}
      </td>
      <td>
        {container.ports.length === 0 ? (
          <span className="cell-sub">—</span>
        ) : (
          <div className="cell-ports">
            {container.ports.map((p, i) => (
              <span key={i}>
                {p.publicPort ? `${p.publicPort} → ${p.privatePort}` : p.privatePort}/{p.type}
              </span>
            ))}
          </div>
        )}
      </td>
      <td>
        <span className="cell-sub">{formatRelativeTime(container.createdAt)}</span>
      </td>
      <td>
        <ContainerActions container={container} onOpenLogs={onOpenLogs} onPatch={onPatch} />
      </td>
    </tr>
  );
}
