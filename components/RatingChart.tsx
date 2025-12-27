import React from 'react';
import type { ChartPoint } from '../lib/reviews';

type Props = { data: ChartPoint[] };

export default function RatingChart({ data }: Props) {
  const [Recharts, setRecharts] = React.useState<any | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    // Dynamically import Recharts so tests can run even if the dependency isn't installed.
    import('recharts')
      .then((mod) => {
        if (!cancelled) setRecharts(mod);
      })
      .catch(() => {
        // Module not available; keep Recharts null to render fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || data.length === 0) return null;

  const last = data[data.length - 1];

  // Custom tooltip renderer to style date darker and show moving avg and daily avg
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const ma = payload.find((p: any) => p.dataKey === 'movingAverage');
    const da = payload.find((p: any) => p.dataKey === 'dailyAverage');

    return (
      <div style={{ background: 'white', border: '1px solid #ddd', padding: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ color: '#111', fontWeight: 600, marginBottom: 4 }}>{`Date: ${label}`}</div>
        {ma && <div style={{ color: '#4f46e5' }}>Moving Avg: {Number(ma.value).toFixed(2)}</div>}
        {da && <div style={{ color: '#60a5fa' }}>Daily Avg: {Number(da.value).toFixed(2)}</div>}
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 12 }} aria-label="average-rating-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong>Average rating over time</strong>
        <div style={{ fontSize: 12, color: '#555' }}>
          {data.length} point{data.length !== 1 ? 's' : ''} · Avg {last.movingAverage ? last.movingAverage.toFixed(2) : last.cumulativeAverage.toFixed(2)}
        </div>
      </div>

      {Recharts ? (
        <div style={{ width: '100%', height: 180 }} data-testid="rating-chart">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 24 }}>
              <Recharts.CartesianGrid strokeDasharray="3 3" />
              <Recharts.XAxis dataKey="date" tick={{ fontSize: 12 }} label={{ value: 'Date', position: 'bottom', offset: 0 }} />
              <Recharts.YAxis domain={[0, 5]} tick={{ fontSize: 12 }} label={{ value: 'Rating', angle: -90, position: 'insideLeft', offset: 0 }} />
              <Recharts.Tooltip content={<CustomTooltip />} />
              <Recharts.Line type="monotone" dataKey="movingAverage" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
              <Recharts.Line type="monotone" dataKey="dailyAverage" stroke="#60a5fa" strokeWidth={1.5} dot={false} opacity={0.6} />
            </Recharts.LineChart>
          </Recharts.ResponsiveContainer>
        </div>
      ) : (
        // Fallback UI when 'recharts' cannot be imported (dev/test environments without the package)
        <div data-testid="rating-chart-fallback" style={{ padding: 12, border: '1px dashed #ddd', borderRadius: 6 }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Chart (interactive view unavailable)</div>
          <div style={{ fontSize: 12, color: '#333' }}>Latest moving avg: {last.movingAverage ? last.movingAverage.toFixed(2) : last.cumulativeAverage.toFixed(2)} (based on {last.cumulativeCount || last.dailyCount} reviews)</div>
        </div>
      )}
    </div>
  );
}
