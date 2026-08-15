import { useEffect, useRef, useState } from 'react';
import { containersApi } from '../api/client';
import type { ContainerSummary } from '../api/types';

const MAX_BUFFERED_LINES = 2000;

export function LogsDrawer({
  container,
  onClose,
}: {
  container: ContainerSummary;
  onClose: () => void;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLines([]);
    setError(null);

    containersApi
      .logTail(container.id, 200)
      .then(({ lines: initial }) => {
        if (!cancelled) setLines(initial);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load logs');
      });

    const source = new EventSource(`/api/containers/${container.id}/logs?follow=true`, {
      withCredentials: true,
    });

    source.addEventListener('log', (evt) => {
      const line = JSON.parse((evt as MessageEvent).data) as string;
      setLines((prev) => {
        const next = [...prev, line];
        return next.length > MAX_BUFFERED_LINES ? next.slice(-MAX_BUFFERED_LINES) : next;
      });
    });

    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) {
        setError((prev) => prev ?? 'Log stream disconnected');
      }
    });

    return () => {
      cancelled = true;
      source.close();
    };
  }, [container.id]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <h2>{container.name} — logs</h2>
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="drawer__body" ref={bodyRef}>
          {error && <div className="form-error">{error}</div>}
          {lines.map((line, i) => (
            <div className="log-line" key={i}>
              {line}
            </div>
          ))}
        </div>
        <div className="drawer__footer">
          <a
            className="btn"
            href={containersApi.logDownloadUrl(container.id)}
            download={`${container.name}-logs.txt`}
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
