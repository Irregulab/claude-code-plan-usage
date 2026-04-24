import type { ActiveBlock } from '../types.ts';

type Props = { block: ActiveBlock | null };

const BLOCK_DURATION_MIN = 300; // 5 hours

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function fmtCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function BlockGauge({ block }: Props) {
  if (!block) {
    return (
      <div className="card block-gauge empty">
        <div className="card-title">Active Block</div>
        <div className="empty-msg">No active block</div>
      </div>
    );
  }

  const elapsedMin = BLOCK_DURATION_MIN - block.remainingMinutes;
  const timePercent = Math.min(100, (elapsedMin / BLOCK_DURATION_MIN) * 100);

  const projectedTokens = block.projection.totalTokens;
  const usedPercent = projectedTokens > 0
    ? Math.min(100, (block.totalTokens / projectedTokens) * 100)
    : 0;

  const hRemain = Math.floor(block.remainingMinutes / 60);
  const mRemain = block.remainingMinutes % 60;

  return (
    <div className="card block-gauge">
      <div className="card-title">Active Block</div>

      <div className="gauge-main">
        <div className="gauge-numbers">
          <span className="big-number">{hRemain}h {mRemain}m</span>
          <span className="big-label">remaining</span>
        </div>
        <div className="gauge-cost">{fmtCost(block.costUSD)}</div>
      </div>

      <div className="bar-group">
        <div className="bar-label">
          <span>Time elapsed</span>
          <span>{elapsedMin}m / {BLOCK_DURATION_MIN}m</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill time-fill" style={{ width: `${timePercent}%` }} />
        </div>
      </div>

      <div className="bar-group">
        <div className="bar-label">
          <span>Tokens used</span>
          <span>{fmt(block.totalTokens)} / {fmt(projectedTokens)} (proj)</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill token-fill" style={{ width: `${usedPercent}%` }} />
          <div className="bar-projected" />
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-val">{fmt(block.tokenCounts.outputTokens)}</span>
          <span className="stat-key">output tokens</span>
        </div>
        <div className="stat">
          <span className="stat-val">{fmt(block.totalTokens)}</span>
          <span className="stat-key">total tokens</span>
        </div>
        <div className="stat">
          <span className="stat-val">{fmtCost(block.projection.totalCost)}</span>
          <span className="stat-key">projected cost</span>
        </div>
      </div>
    </div>
  );
}
