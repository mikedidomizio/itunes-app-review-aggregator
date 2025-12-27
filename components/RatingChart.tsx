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

  return (
    <div style={{ marginBottom: 12 }} aria-label="average-rating-chart">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong>Average rating over time</strong>
        <div style={{ fontSize: 12, color: '#555' }}>
          {data.length} point{data.length !== 1 ? 's' : ''} · Avg {last.cumulativeAverage.toFixed(2)}
        </div>
      </div>

      {Recharts ? (
        <div style={{ width: '100%', height: 180 }} data-testid="rating-chart">
          <Recharts.ResponsiveContainer width="100%" height="100%">
            <Recharts.LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 24 }}>
              <Recharts.CartesianGrid strokeDasharray="3 3" />
              <Recharts.XAxis dataKey="date" tick={{ fontSize: 12 }} label={{ value: 'Date', position: 'bottom', offset: 0 }} />
              <Recharts.YAxis domain={[0, 5]} tick={{ fontSize: 12 }} label={{ value: 'Rating', angle: -90, position: 'insideLeft', offset: 0 }} />
              <Recharts.Tooltip formatter={(value: any, name: any) => {
                if (name === 'cumulativeAverage') return [(value as number).toFixed(2), 'Cumulative Avg'];
                if (name === 'dailyAverage') return [(value as number).toFixed(2), 'Daily Avg'];
                return [value, name];
              }} labelFormatter={(label: any) => `Date: ${label}`} />
              <Recharts.Line type="monotone" dataKey="cumulativeAverage" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
              <Recharts.Line type="monotone" dataKey="dailyAverage" stroke="#60a5fa" strokeWidth={1.5} dot={false} opacity={0.6} />
            </Recharts.LineChart>
          </Recharts.ResponsiveContainer>
        </div>
      ) : (
        // Fallback UI when 'recharts' cannot be imported (dev/test environments without the package)
        <div data-testid="rating-chart-fallback" style={{ padding: 12, border: '1px dashed #ddd', borderRadius: 6 }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>Chart (interactive view unavailable)</div>
          <div style={{ fontSize: 12, color: '#333' }}>Latest average: {last.cumulativeAverage.toFixed(2)} (based on {last.cumulativeCount} reviews)</div>
        </div>
      )}
    </div>
  );
}
