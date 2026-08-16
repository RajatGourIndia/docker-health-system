import { useEffect, useRef, useState } from 'react';
import { containersApi } from '../api/client';
import type { ContainerSummary } from '../api/types';

const MAX_BUFFERED_LINES = 2000;

// Lines come back with `--timestamps` (RFC3339 nano, e.g.
// "2024-01-01T12:00:00.123456789Z message text") — split that off for
// dimmed display and to detect a rough log level from the remainder.
const TIMESTAMP_RE = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s(.*)$/;
const LEVEL_RE: [RegExp, 'error' | 'warn'][] = [
  [/\b(error|fatal|exception|panic)\b/i, 'error'],
  [/\b(warn(ing)?)\b/i, 'warn'],
];

function parseLine(line: string): { timestamp: string | null; message: string } {
  const match = line.match(TIMESTAMP_RE);
  return match ? { timestamp: match[1], message: match[2] } : { timestamp: null, message: line };
}

function levelOf(message: string): 'error' | 'warn' | null {
  for (const [re, level] of LEVEL_RE) {
    if (re.test(message)) return level;
  }
  return null;
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

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
          {lines.map((line, i) => {
            const { timestamp, message } = parseLine(line);
            const level = levelOf(message);
            return (
              <div className={`log-line${level ? ` log-line--${level}` : ''}`} key={i}>
                {timestamp && <span className="log-line__ts">{formatLogTime(timestamp)}</span>}
                <span className="log-line__msg">{message}</span>
              </div>
            );
          })}
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
