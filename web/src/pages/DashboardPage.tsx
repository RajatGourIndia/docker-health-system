import { useState } from 'react';
import { Box } from 'lucide-react';
import { useContainerEvents } from '../hooks/useContainerEvents';
import { ContainerRow } from '../components/ContainerRow';
import { LogsDrawer } from '../components/LogsDrawer';
import type { ContainerSummary } from '../api/types';

const SKELETON_COLUMNS = [70, 20, 80, 80, 60, 60, 110];

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, row) => (
        <tr key={row} className="skeleton-row" aria-hidden="true">
          {SKELETON_COLUMNS.map((width, col) => (
            <td key={col}>
              <div className="skeleton-bar" style={{ width: `${width}px` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DashboardPage() {
  const { containers, loaded, connectionError, patchContainer } = useContainerEvents();
  const [logsFor, setLogsFor] = useState<ContainerSummary | null>(null);

  return (
    <>
      <div className="page-header">
        <h1>Containers</h1>
        {loaded && <span className="cell-sub">{containers.length} total</span>}
      </div>

      {connectionError && <div className="connection-banner">{connectionError}</div>}

      {loaded && containers.length === 0 ? (
        <div className="empty-state">
          <Box size={28} strokeWidth={1.5} />
          <p>No containers running</p>
          <span className="cell-sub">Start one — e.g. `docker run -d nginx` — and it'll show up here.</span>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Ports</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loaded ? (
                containers.map((container) => (
                  <ContainerRow
                    key={container.id}
                    container={container}
                    onOpenLogs={setLogsFor}
                    onPatch={patchContainer}
                  />
                ))
              ) : (
                <SkeletonRows />
              )}
            </tbody>
          </table>
        </div>
      )}

      {logsFor && <LogsDrawer container={logsFor} onClose={() => setLogsFor(null)} />}
    </>
  );
}
