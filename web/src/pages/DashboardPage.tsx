import { useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { useContainerEvents } from '../hooks/useContainerEvents';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { useDynamicPageSize } from '../hooks/useDynamicPageSize';
import { ContainerRow } from '../components/ContainerRow';
import { LogsDrawer } from '../components/LogsDrawer';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import type { ContainerSummary } from '../api/types';

const ROW_HEIGHT_PX = 62;
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

function matchesContainer(container: ContainerSummary, q: string): boolean {
  return (
    container.name.toLowerCase().includes(q) ||
    container.image.toLowerCase().includes(q) ||
    container.state.toLowerCase().includes(q) ||
    container.status.toLowerCase().includes(q)
  );
}

export function DashboardPage() {
  const { containers, loaded, connectionError, patchContainer } = useContainerEvents();
  const [logsFor, setLogsFor] = useState<ContainerSummary | null>(null);
  const tableAnchorRef = useRef<HTMLDivElement>(null);
  const pageSize = useDynamicPageSize(ROW_HEIGHT_PX, tableAnchorRef);
  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = usePagedFilter(
    containers,
    matchesContainer,
    pageSize
  );

  return (
    <>
      <div className="page-header">
        <h1>Containers</h1>
        {loaded && (
          <span className="cell-sub">
            {filtered.length} of {containers.length}
          </span>
        )}
      </div>

      {connectionError && <div className="connection-banner">{connectionError}</div>}

      {loaded && (
        <div className="page-toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, image, status…" />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {loaded && containers.length === 0 ? (
        <div className="empty-state">
          <Box size={28} strokeWidth={1.5} />
          <p>No containers running</p>
          <span className="cell-sub">Start one — e.g. `docker run -d nginx` — and it'll show up here.</span>
        </div>
      ) : loaded && filtered.length === 0 ? (
        <div className="empty-state">
          <Box size={28} strokeWidth={1.5} />
          <p>No containers match "{query}"</p>
        </div>
      ) : (
        <div className="table-wrap" ref={tableAnchorRef}>
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
                pageItems.map((container) => (
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
