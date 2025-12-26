"use client";

import React, { useState } from 'react';
import ReviewsList from '../../components/ReviewsList';
import type { Review } from '../../lib/reviews';

export default function ReviewsPage() {
  const [appId, setAppId] = useState('1465992052');
  const [country, setCountry] = useState('ca');
  const [pages, setPages] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews?appId=${encodeURIComponent(appId)}&country=${encodeURIComponent(country)}&pages=${pages}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e: unknown) {
      setError(String((e as Error)?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // Auto-load reviews once when the component mounts
    load();
    // Intentionally run only once on mount. If you want auto-reload when inputs change,
    // add appId/country/pages to the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>App Store Reviews</h1>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>App ID</label>
        <input value={appId} onChange={(e) => setAppId(e.target.value)} />
        <label style={{ marginLeft: 8 }}>Country</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: 40 }} />
        <label style={{ marginLeft: 8 }}>Pages</label>
        <input type="number" value={pages} onChange={(e) => setPages(Number(e.target.value))} style={{ width: 60 }} />
        <button onClick={load} style={{ marginLeft: 8 }}>Load</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div role="alert">Error: {error}</div>}

      <ReviewsList reviews={reviews} />
    </div>
  );
}
