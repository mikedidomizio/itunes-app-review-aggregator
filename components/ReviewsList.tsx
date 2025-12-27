import React from 'react';
import type { Review } from '../lib/reviews';

export default function ReviewsList({ reviews, loading }: { reviews: Review[]; loading?: boolean }) {
  if (!reviews || reviews.length === 0) {
    if (loading) return null; // hide the empty message while loading
    return <div>No reviews found.</div>;
  }

  return (
    <ul aria-label="reviews-list">
      {reviews.map((r) => (
        <li key={r.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{r.author}</strong>
            <span>{new Date(r.date).toLocaleString()}</span>
          </div>
          {r.title && <div style={{ fontWeight: 600 }}>{r.title}</div>}
          <div>{r.content}</div>
          <div style={{ marginTop: 6 }}>
            <small>Rating: {r.rating} · Version: {r.version || '—'}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}
