import { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { imagesApi } from '../api/client';
import { usePagedFilter } from '../hooks/usePagedFilter';
import { useDynamicPageSize } from '../hooks/useDynamicPageSize';
import { SearchInput } from '../components/SearchInput';
import { Pagination } from '../components/Pagination';
import { formatBytes, formatRelativeTime } from '../utils/format';
import type { ImageSummary } from '../api/types';

const ROW_HEIGHT_PX = 60;
const LARGE_IMAGE_BYTES = 500 * 1024 * 1024;

function isOwnImage(image: ImageSummary): boolean {
  return image.repoTags.some((tag) => tag.toLowerCase().includes('docker-health-system'));
}

function matchesImage(image: ImageSummary, q: string): boolean {
  if (image.repoTags.some((tag) => tag.toLowerCase().includes(q))) return true;
  return image.id.toLowerCase().includes(q);
}

export function ImagesPage() {
  const [images, setImages] = useState<ImageSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tableAnchorRef = useRef<HTMLDivElement>(null);
  const pageSize = useDynamicPageSize(ROW_HEIGHT_PX, tableAnchorRef);
  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = usePagedFilter(
    images ?? [],
    matchesImage,
    pageSize
  );

  useEffect(() => {
    let cancelled = false;
    imagesApi
      .list()
      .then((data) => {
        if (!cancelled) setImages(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load images');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Images</h1>
        {images && (
          <span className="cell-sub">
            {filtered.length} of {images.length}
          </span>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      {images && (
        <div className="page-toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="Search repository, tag, ID…" />
        </div>
      )}

      {!images ? (
        <div className="table-empty">Loading images…</div>
      ) : images.length === 0 ? (
        <div className="empty-state">
          <Layers size={28} strokeWidth={1.5} />
          <p>No images found</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Layers size={28} strokeWidth={1.5} />
          <p>No images match "{query}"</p>
        </div>
      ) : (
        <div className="table-wrap" ref={tableAnchorRef}>
          <table className="table">
            <thead>
              <tr>
                <th>Repository : tag</th>
                <th>Image ID</th>
                <th>Size</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((image) => (
                <tr key={image.id}>
                  <td>
                    <div className="image-repo">
                      <Layers size={14} className="image-repo__icon" aria-hidden="true" />
                      <div>
                        {image.repoTags.length === 0 ? (
                          <span className="cell-sub">&lt;none&gt;</span>
                        ) : (
                          image.repoTags.map((tag) => (
                            <div className="cell-name" key={tag} title={tag}>
                              {tag}
                            </div>
                          ))
                        )}
                        <div className="tag-row">
                          {isOwnImage(image) && <span className="tag-pill tag-pill--accent">Local Build</span>}
                          {image.size > LARGE_IMAGE_BYTES && (
                            <span className="tag-pill tag-pill--warning">Large</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-sub">{image.id.replace('sha256:', '').slice(0, 12)}</td>
                  <td>{formatBytes(image.size)}</td>
                  <td className="cell-sub">{formatRelativeTime(image.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {images && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </>
  );
}
