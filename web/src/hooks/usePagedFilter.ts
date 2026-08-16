import { useEffect, useMemo, useState } from 'react';

/**
 * Client-side search + pagination, shared by the Containers and Images
 * tables so both behave identically at the UI level. `pageSize` is expected
 * to come from useDynamicPageSize so the page adapts to the viewport rather
 * than using a fixed row count.
 */
export function usePagedFilter<T>(
  items: T[],
  matches: (item: T, query: string) => boolean,
  pageSize: number
) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((item) => matches(item, q)) : items;
  }, [items, query, matches]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { query, setQuery, page, setPage, totalPages, filtered, pageItems };
}
