import { useEffect } from 'react';
import { authApi } from '../api/client';

// Don't ping the server more than once a minute even if the user is
// continuously moving the mouse — this only needs to be frequent enough
// that real activity reliably keeps lastActivity ahead of the idle timeout,
// which is configured in minutes.
const PING_THROTTLE_MS = 60_000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
];

/**
 * Refreshes the session's idle-timeout clock only on genuine user
 * interaction. Mounted once for the authenticated shell (see Layout) —
 * background API traffic (SSE, the reconcile poll) deliberately does NOT
 * count as activity, or idle timeout could never trigger while a tab with
 * live data stays open.
 */
export function useActivityPing() {
  useEffect(() => {
    let lastPing = 0;
    let pinging = false;

    function onActivity() {
      const now = Date.now();
      if (pinging || now - lastPing < PING_THROTTLE_MS) return;
      pinging = true;
      lastPing = now;
      authApi.touch().catch(() => {
        // A failed ping (e.g. session already expired) is handled by the
        // global 401 interceptor — nothing extra to do here.
      }).finally(() => {
        pinging = false;
      });
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );
    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, []);
}
