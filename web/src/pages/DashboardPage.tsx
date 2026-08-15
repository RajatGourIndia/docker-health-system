import { useState } from 'react';
import { useContainerEvents } from '../hooks/useContainerEvents';
import { ContainerRow } from '../components/ContainerRow';
import { LogsDrawer } from '../components/LogsDrawer';
import type { ContainerSummary } from '../api/types';

export function DashboardPage() {
  const { containers, loaded, connectionError, patchContainer } = useContainerEvents();
  const [logsFor, setLogsFor] = useState<ContainerSummary | null>(null);

  return (
    <>
      <div className="page-header">
        <h1>Containers</h1>
        <span className="cell-sub">{containers.length} total</span>
      </div>

      {connectionError && <div className="connection-banner">{connectionError}</div>}

      {!loaded ? (
        <div className="table-empty">Loading containers…</div>
      ) : containers.length === 0 ? (
        <div className="table-empty">No containers found.</div>
      ) : (
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
            {containers.map((container) => (
              <ContainerRow
                key={container.id}
                container={container}
                onOpenLogs={setLogsFor}
                onPatch={patchContainer}
              />
            ))}
          </tbody>
        </table>
      )}

      {logsFor && <LogsDrawer container={logsFor} onClose={() => setLogsFor(null)} />}
    </>
  );
}
