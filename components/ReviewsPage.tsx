"use client";

import React, { useState, useRef } from 'react';
import ReviewsList from './ReviewsList';
import RatingChart from './RatingChart';
import { computeDailyMovingAverage } from '../lib/reviews';
import type { Review } from '../lib/reviews';

type Props = {
  initialAppId?: string;
  initialCountry?: string;
  initialPages?: number;
};

export default function ReviewsPage({ initialAppId = '', initialCountry = 'ca', initialPages = 3 }: Props) {
  const MAX_PAGES = 10;

  const [appId, setAppId] = useState(initialAppId);
  const [country, setCountry] = useState(initialCountry);
  // pages can be overridden by the `pages` query param in the URL; default to initialPages (3)
  const [pages, setPages] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const p = params.get('pages');
        if (p) {
          const n = Number(p);
          if (Number.isInteger(n) && n > 0) return Math.min(n, MAX_PAGES);
        }
      }
    } catch {
      // ignore
    }
    return initialPages;
  });
  // Moving average window (days). Default to 7.
  const [windowDays, setWindowDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const didInitUrlRef = useRef(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const encodedApp = encodeURIComponent(appId);
      const res = await fetch(`/api/reviews?appId=${encodedApp}&country=${encodeURIComponent(country)}&pages=${pages}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the `pages` query param in the URL in sync with the pages state.
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const current = params.get('pages');
      const wanted = String(pages);
      if (current !== wanted) {
        if (pages === undefined || pages === null) {
          params.delete('pages');
        } else {
          params.set('pages', wanted);
        }
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '') + window.location.hash;
        // Replace history so back button behavior isn't affected
        window.history.replaceState({}, '', newUrl);
      }
    } catch (_err) {
      // ignore
    }
    // Note: we intentionally do not include window in deps
  }, [pages]);

  // Ensure we only attempt to parse URL once on mount for other effects if needed
  React.useEffect(() => {
    if (didInitUrlRef.current) return;
    didInitUrlRef.current = true;
  }, []);

  const chartData = computeDailyMovingAverage(reviews, windowDays);

  // Map numeric window to human-friendly label for display
  const windowLabel = (() => {
    if (windowDays === 7) return '7-day';
    if (windowDays === 14) return '14-day';
    if (windowDays === 21) return '21-day';
    if (windowDays === 30) return '1 month';
    if (windowDays === 182) return '6 months';
    return `${windowDays}-day`;
  })();

  return (
    <div style={{ padding: 20 }}>
      <h1>App Store Reviews</h1>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>App ID</label>
        <input value={appId} onChange={(e) => setAppId(e.target.value)} />
        <label style={{ marginLeft: 8 }}>Country</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: 40 }} />
        <label style={{ marginLeft: 8 }}>Pages</label>
        <input type="number" value={pages} onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isFinite(v) || v < 1) {
            // keep within bounds
            setPages(1);
            return;
          }
          // Clamp to [1, MAX_PAGES]
          const clamped = Math.max(1, Math.min(Math.trunc(v), MAX_PAGES));
          setPages(clamped);
        }} style={{ width: 60 }} />
        <label style={{ marginLeft: 12, marginRight: 8 }}>Window</label>
        <select aria-label="moving-average-window" value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value))}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={21}>21 days</option>
          <option value={30}>1 month</option>
          <option value={182}>6 months</option>
        </select>
        <button onClick={load} style={{ marginLeft: 8 }}>Load</button>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div role="alert">Error: {error}</div>}

      <RatingChart data={chartData} windowLabel={windowLabel} />

      <ReviewsList reviews={reviews} />
    </div>
  );
}
