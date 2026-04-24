import type { PlanUsage, PlanUtilization } from '../types.ts';

type Props = { planUsage: PlanUsage | null };

function pctClass(p: number): string {
  if (p >= 90) return 'pct-danger';
  if (p >= 70) return 'pct-warn';
  return 'pct-ok';
}

function resetIn(resetsAt: string | null): string | null {
  if (!resetsAt) return null;
  const ms = new Date(resetsAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function Row({ label, util }: { label: string; util: PlanUtilization | null }) {
  if (!util) {
    return (
      <div className="plan-row">
        <div className="plan-row-header">
          <span className="plan-row-label">{label}</span>
          <span className="plan-row-pct plan-row-pct-muted">—</span>
        </div>
        <div className="bar-track bar-track-lg">
          <div className="bar-fill plan-fill pct-ok" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }
  const pct = util.utilization;
  const capped = Math.min(100, pct);
  const reset = resetIn(util.resetsAt);
  return (
    <div className="plan-row">
      <div className="plan-row-header">
        <span className="plan-row-label">{label}</span>
        <span className={`plan-row-pct ${pctClass(pct)}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="bar-track bar-track-lg">
        <div className={`bar-fill plan-fill ${pctClass(pct)}`} style={{ width: `${capped}%` }} />
      </div>
      {reset && <div className="plan-row-sub">resets in {reset}</div>}
    </div>
  );
}

export function PlanUsageCard({ planUsage }: Props) {
  const hasAny = planUsage && (planUsage.fiveHour || planUsage.sevenDay || planUsage.sevenDayOpus);

  return (
    <div className="card plan-usage-card">
      <div className="card-title">Plan Used</div>

      {hasAny ? (
        <div className="plan-rows">
          <Row label="5-hour window" util={planUsage?.fiveHour ?? null} />
          <Row label="7-day · all models" util={planUsage?.sevenDay ?? null} />
          {planUsage?.sevenDayOpus && <Row label="7-day · Opus only" util={planUsage.sevenDayOpus} />}
        </div>
      ) : (
        <div className="empty-msg">
          {planUsage?.error ? `Waiting… (${planUsage.error})` : 'Waiting for plan data…'}
        </div>
      )}
    </div>
  );
}
