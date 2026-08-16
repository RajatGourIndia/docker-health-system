import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import type { AdminSettings } from '../api/types';

/** Fetched once on mount; null until it resolves. */
export function useSettings(): AdminSettings | null {
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getSettings()
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {
        // Non-critical — callers fall back to their own defaults.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
