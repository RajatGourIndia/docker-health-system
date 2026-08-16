import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

const MIN_PAGE_SIZE = 4;
const MAX_PAGE_SIZE = 50;
// Space below the table reserved for the pagination row + page bottom padding.
const RESERVED_BELOW_PX = 72;

/**
 * Computes how many table rows fit between `anchorRef`'s current top offset
 * and the bottom of the viewport, so pagination adapts to the actual window
 * size instead of a fixed row count. Recalculates on resize.
 */
export function useDynamicPageSize(rowHeightPx: number, anchorRef: RefObject<HTMLElement>): number {
  const [pageSize, setPageSize] = useState(MAX_PAGE_SIZE);

  useEffect(() => {
    function recalc() {
      const top = anchorRef.current?.getBoundingClientRect().top ?? 0;
      const available = window.innerHeight - top - RESERVED_BELOW_PX;
      const rows = Math.floor(available / rowHeightPx);
      setPageSize(Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, rows)));
    }

    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [rowHeightPx, anchorRef]);

  return pageSize;
}
