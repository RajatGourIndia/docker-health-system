import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 15;

/**
 * Client-side search + pagination, shared by the Containers and Images
 * tables so both behave identically at the UI level.
 */
export function usePagedFilter<T>(items: T[], matches: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((item) => matches(item, q)) : items;
  }, [items, query, matches]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return { query, setQuery, page, setPage, totalPages, filtered, pageItems };
}
