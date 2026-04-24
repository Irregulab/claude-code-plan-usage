import { useState, useEffect, useRef } from 'react';
import type { UsageSnapshot, ServerEnvelope } from '../types.ts';

export type ConnectionStatus = 'connecting' | 'connected' | 'stale' | 'disconnected';

export type UsageState = {
  snapshot: UsageSnapshot | null;
  receivedAt: number | null;
  stale: boolean;
  status: ConnectionStatus;
};

const INITIAL: UsageState = {
  snapshot: null,
  receivedAt: null,
  stale: false,
  status: 'connecting',
};

const BASE_DELAY = 1_000;
const MAX_DELAY = 30_000;
const WS_FAIL_THRESHOLD = 3;
const HTTP_POLL_MS = 15_000;

function buildWsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}

export function useUsageSocket(): UsageState {
  const [state, setState] = useState<UsageState>(INITIAL);
  const wsRef = useRef<WebSocket | null>(null);
  const wsFailsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const httpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelayRef = useRef(BASE_DELAY);

  function startHttpFallback(): void {
    if (httpTimerRef.current) return;
    httpTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/usage');
        const data = await res.json() as { snapshot: UsageSnapshot | null; receivedAt: number | null; stale: boolean };
        if (data.snapshot) {
          setState((prev) => ({
            ...prev,
            snapshot: data.snapshot,
            receivedAt: data.receivedAt,
            stale: data.stale,
          }));
        }
      } catch { /* ignore */ }
    }, HTTP_POLL_MS);
  }

  function stopHttpFallback(): void {
    if (httpTimerRef.current) {
      clearInterval(httpTimerRef.current);
      httpTimerRef.current = null;
    }
  }

  function connect(): void {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setState((prev) => ({ ...prev, status: 'connecting' }));

    const ws = new WebSocket(buildWsUrl());
    wsRef.current = ws;

    ws.addEventListener('open', () => {
      wsFailsRef.current = 0;
      reconnectDelayRef.current = BASE_DELAY;
      stopHttpFallback();
      setState((prev) => ({ ...prev, status: 'connected' }));
    });

    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data as string) as ServerEnvelope;
      if (msg.type === 'snapshot') {
        setState({ snapshot: msg.snapshot, receivedAt: msg.receivedAt, stale: false, status: 'connected' });
      } else if (msg.type === 'stale') {
        setState((prev) => ({ ...prev, stale: true, status: 'stale' }));
      } else if (msg.type === 'empty') {
        setState((prev) => ({ ...prev, status: 'connected' }));
      }
    });

    ws.addEventListener('close', () => {
      wsRef.current = null;
      wsFailsRef.current++;
      setState((prev) => ({ ...prev, status: 'disconnected' }));

      if (wsFailsRef.current >= WS_FAIL_THRESHOLD) startHttpFallback();

      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_DELAY);
        connect();
      }, reconnectDelayRef.current);
    });

    ws.addEventListener('error', () => { ws.close(); });
  }

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopHttpFallback();
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
