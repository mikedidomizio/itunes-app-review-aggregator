import React from 'react';
import type { Review } from '../lib/reviews';

type Props = { reviews: Review[] };

export default function RatingChart({ reviews }: Props) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Aggregate by day (YYYY-MM-DD)
  const byDay = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const day = d.toISOString().slice(0, 10);
    const cur = byDay.get(day) ?? { sum: 0, count: 0 };
    cur.sum += Number(r.rating) || 0;
    cur.count += 1;
    byDay.set(day, cur);
  }

  const points = Array.from(byDay.entries())
    .map(([day, v]) => ({ day, avg: v.count ? v.sum / v.count : 0 }))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));

  if (points.length === 0) return null;

  // SVG sizing
  const width = 600;
  const height = 120;
  const padding = 16;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const maxRating = 5;
  const minRating = 0;

  const xFor = (i: number) => (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW) + padding;
  const yFor = (avg: number) => padding + ((maxRating - avg) / (maxRating - minRating)) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(p.avg).toFixed(2)}`)
    .join(' ');

  // Area path (down to baseline)
  const areaD = `${pathD} L ${xFor(points.length - 1).toFixed(2)} ${yFor(minRating).toFixed(2)} L ${xFor(0).toFixed(2)} ${yFor(minRating).toFixed(2)} Z`;

  const first = points[0];
  const last = points[points.length - 1];

  const overallAvg = points.reduce((s, p) => s + p.avg, 0) / points.length;

  return (
    <div style={{ marginBottom: 12 }} aria-hidden={false} aria-label="average-rating-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong>Average rating over time</strong>
        <div style={{ fontSize: 12, color: '#555' }}>
          {points.length} day{points.length !== 1 ? 's' : ''} · Avg {overallAvg.toFixed(2)}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Average rating chart">
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* grid lines */}
        {[0, 1, 2, 3, 4, 5].map((v) => {
          const y = yFor(v);
          return <line key={v} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#eee" strokeWidth={1} />;
        })}

        {/* area */}
        <path d={areaD} fill="url(#grad)" stroke="none" />

        {/* line */}
        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* points */}
        {points.map((p, i) => (
          <circle key={p.day} cx={xFor(i)} cy={yFor(p.avg)} r={3.5} fill="#fff" stroke="#4f46e5" strokeWidth={1.5} />
        ))}

        {/* labels: first and last date small */}
        <text x={padding} y={height - 4} fontSize={10} fill="#666">{first.day}</text>
        <text x={width - padding} y={height - 4} fontSize={10} fill="#666" textAnchor="end">{last.day}</text>
      </svg>
    </div>
  );
}
