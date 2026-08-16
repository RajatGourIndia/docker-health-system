import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { setupApi } from '../api/client';
import { SetupPage } from '../pages/SetupPage';

type SetupState = 'checking' | 'needsSetup' | 'ready';

export function SetupGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SetupState>('checking');

  useEffect(() => {
    setupApi
      .status()
      .then((res) => setState(res.hasAdmin ? 'ready' : 'needsSetup'))
      // Fail open to the normal login flow rather than block the app if this
      // one check errors — login will just fail with a clear message anyway.
      .catch(() => setState('ready'));
  }, []);

  if (state === 'checking') {
    return <div className="app-loading">Loading…</div>;
  }
  if (state === 'needsSetup') {
    return <SetupPage onComplete={() => setState('ready')} />;
  }
  return <>{children}</>;
}
