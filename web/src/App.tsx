import { useState, useEffect, useRef } from 'react';
import { useUsageSocket } from './hooks/useUsageSocket.ts';
import { BlockGauge } from './components/BlockGauge.tsx';
import { BurnRateCard } from './components/BurnRateCard.tsx';
import { WeeklyCard } from './components/WeeklyCard.tsx';
import { ModelsCard } from './components/ModelsCard.tsx';
import type { ActiveBlock } from './types.ts';

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  connected: 'Live',
  stale: 'Stale',
  disconnected: 'Disconnected',
};

export default function App() {
  const { snapshot, receivedAt, stale, status } = useUsageSocket();
  const prevBlockRef = useRef<ActiveBlock | null>(null);
  const [secondsSince, setSecondsSince] = useState(0);

  useEffect(() => {
    if (snapshot?.activeBlock) prevBlockRef.current = snapshot.activeBlock;
  }, [snapshot]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsSince(receivedAt ? Math.round((Date.now() - receivedAt) / 1000) : 0);
    }, 1000);
    return () => clearInterval(id);
  }, [receivedAt]);

  const block = snapshot?.activeBlock ?? null;
  const prevBlock = prevBlockRef.current;

  return (
    <div className="dashboard">
      {stale && <div className="stale-banner">STALE — agent not pushing</div>}
      {!snapshot && status === 'connected' && (
        <div className="stale-banner waiting">WAITING FOR AGENT</div>
      )}

      <div className="grid">
        <BlockGauge block={block} />
        <BurnRateCard block={block} prev={prevBlock} />
        <WeeklyCard weekly={snapshot?.weekly ?? null} daily={snapshot?.daily ?? []} />
        <ModelsCard block={block} />
      </div>

      <footer className="footer">
        <span className={`ws-dot status-${status}`} title={STATUS_LABEL[status]} />
        <span className="footer-status">{STATUS_LABEL[status]}</span>
        {receivedAt && (
          <span className="footer-age">· updated {secondsSince}s ago</span>
        )}
        {snapshot?.source?.host && (
          <span className="footer-host">· agent: {snapshot.source.host}</span>
        )}
      </footer>
    </div>
  );
}
