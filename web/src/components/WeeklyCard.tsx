import type { WeeklyTotals, DailyPoint } from '../types.ts';

type Props = { weekly: WeeklyTotals | null; daily: DailyPoint[] };

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function WeeklyCard({ weekly, daily }: Props) {
  const maxTokens = daily.length > 0 ? Math.max(...daily.map((d) => d.totalTokens), 1) : 1;

  return (
    <div className="card weekly">
      <div className="card-title">This Week</div>

      {weekly ? (
        <div className="weekly-totals">
          <div className="weekly-stat">
            <span className="big-number">{fmt(weekly.totalTokens)}</span>
            <span className="big-label">tokens</span>
          </div>
          <div className="weekly-stat">
            <span className="big-number">${weekly.totalCostUSD.toFixed(2)}</span>
            <span className="big-label">cost</span>
          </div>
        </div>
      ) : (
        <div className="empty-msg">No weekly data</div>
      )}

      {daily.length > 0 && (
        <div className="sparkline">
          {daily.map((d) => {
            const pct = (d.totalTokens / maxTokens) * 100;
            const label = d.date.slice(5); // MM-DD
            return (
              <div key={d.date} className="spark-col">
                <div className="spark-bar-wrap">
                  <div className="spark-bar" style={{ height: `${Math.max(2, pct)}%` }} />
                </div>
                <span className="spark-label">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
