import { useEffect, useState } from 'react';
import { imagesApi } from '../api/client';
import { formatBytes, formatRelativeTime } from '../utils/format';
import type { ImageSummary } from '../api/types';

export function ImagesPage() {
  const [images, setImages] = useState<ImageSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        {images && <span className="cell-sub">{images.length} total</span>}
      </div>

      {error && <div className="form-error">{error}</div>}

      {!images ? (
        <div className="table-empty">Loading images…</div>
      ) : images.length === 0 ? (
        <div className="table-empty">No images found.</div>
      ) : (
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
            {images.map((image) => (
              <tr key={image.id}>
                <td>
                  {image.repoTags.length === 0 ? (
                    <span className="cell-sub">&lt;none&gt;</span>
                  ) : (
                    image.repoTags.map((tag) => <div key={tag}>{tag}</div>)
                  )}
                </td>
                <td className="cell-sub">{image.id.replace('sha256:', '').slice(0, 12)}</td>
                <td>{formatBytes(image.size)}</td>
                <td className="cell-sub">{formatRelativeTime(image.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
