import type { ActiveBlock } from '../types.ts';

type Props = { block: ActiveBlock | null; prev: ActiveBlock | null };

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function trend(curr: number, prev: number | null): string {
  if (prev === null) return '';
  if (curr > prev * 1.05) return '↑';
  if (curr < prev * 0.95) return '↓';
  return '→';
}

function shortModel(m: string): string {
  return m
    .replace('claude-', '')
    .replace('-20251001', '')
    .replace('-20250219', '');
}

export function BurnRateCard({ block, prev }: Props) {
  if (!block) {
    return (
      <div className="card burn-rate empty">
        <div className="card-title">Burn Rate</div>
        <div className="empty-msg">—</div>
      </div>
    );
  }

  const tokPerMin = Math.round(block.burnRate.tokensPerMinute);
  const prevTokPerMin = prev ? Math.round(prev.burnRate.tokensPerMinute) : null;
  const costPerHour = block.burnRate.costPerHour;
  const prevCostPerHour = prev?.burnRate.costPerHour ?? null;

  const cacheTotal = block.tokenCounts.cacheCreationInputTokens + block.tokenCounts.cacheReadInputTokens;
  const efficiency = cacheTotal > 0
    ? Math.round((block.tokenCounts.cacheReadInputTokens / cacheTotal) * 100)
    : 0;

  return (
    <div className="card burn-rate">
      <div className="card-title">Burn Rate</div>

      <div className="burn-main">
        <div className="burn-row">
          <span className="burn-val">{fmt(tokPerMin)}</span>
          <span className="burn-unit">tokens / min</span>
          <span className="burn-trend">{trend(tokPerMin, prevTokPerMin)}</span>
        </div>
        <div className="burn-row">
          <span className="burn-val">${costPerHour.toFixed(2)}</span>
          <span className="burn-unit">/ hour</span>
          <span className="burn-trend">{trend(costPerHour, prevCostPerHour)}</span>
        </div>
      </div>

      <div className="burn-models">
        <div className="burn-models-row">
          <span className="burn-models-label">Cache hit</span>
          <div className="cache-inline">
            <div className="bar-track bar-track-sm">
              <div className="bar-fill cache-fill" style={{ width: `${efficiency}%` }} />
            </div>
            <span className="cache-pct-compact">{efficiency}%</span>
          </div>
          <div className="model-list-compact model-list-right">
            {block.models.map((m) => (
              <span key={m} className="model-chip-compact">{shortModel(m)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-row stat-row-compact">
        <div className="stat">
          <span className="stat-val stat-val-sm">{fmt(block.tokenCounts.inputTokens)}</span>
          <span className="stat-key">input</span>
        </div>
        <div className="stat">
          <span className="stat-val stat-val-sm">{fmt(block.tokenCounts.cacheReadInputTokens)}</span>
          <span className="stat-key">cache reads</span>
        </div>
        <div className="stat">
          <span className="stat-val stat-val-sm">{fmt(block.tokenCounts.cacheCreationInputTokens)}</span>
          <span className="stat-key">cache writes</span>
        </div>
      </div>
    </div>
  );
}
