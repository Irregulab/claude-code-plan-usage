import type { ActiveBlock } from '../types.ts';

type Props = { block: ActiveBlock | null };

function shortModel(m: string): string {
  return m
    .replace('claude-', '')
    .replace('-20251001', '')
    .replace('-20250219', '');
}

export function ModelsCard({ block }: Props) {
  if (!block) {
    return (
      <div className="card models empty">
        <div className="card-title">Models</div>
        <div className="empty-msg">No active block</div>
      </div>
    );
  }

  const cacheTotal = block.tokenCounts.cacheCreationInputTokens + block.tokenCounts.cacheReadInputTokens;
  const efficiency = cacheTotal > 0
    ? Math.round((block.tokenCounts.cacheReadInputTokens / cacheTotal) * 100)
    : 0;

  const totalAllTokens = block.tokenCounts.inputTokens +
    block.tokenCounts.outputTokens +
    block.tokenCounts.cacheCreationInputTokens +
    block.tokenCounts.cacheReadInputTokens;

  return (
    <div className="card models">
      <div className="card-title">Models</div>

      <div className="model-list">
        {block.models.map((m) => (
          <div key={m} className="model-chip">{shortModel(m)}</div>
        ))}
      </div>

      <div className="cache-section">
        <div className="cache-label">Cache efficiency</div>
        <div className="bar-track">
          <div className="bar-fill cache-fill" style={{ width: `${efficiency}%` }} />
        </div>
        <div className="cache-pct">{efficiency}%</div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-val">{(block.tokenCounts.cacheReadInputTokens / 1_000_000).toFixed(1)}M</span>
          <span className="stat-key">cache reads</span>
        </div>
        <div className="stat">
          <span className="stat-val">{(block.tokenCounts.cacheCreationInputTokens / 1_000_000).toFixed(1)}M</span>
          <span className="stat-key">cache writes</span>
        </div>
        <div className="stat">
          <span className="stat-val">{(totalAllTokens / 1_000_000).toFixed(1)}M</span>
          <span className="stat-key">total tokens</span>
        </div>
      </div>
    </div>
  );
}
