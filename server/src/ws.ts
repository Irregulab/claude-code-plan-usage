import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { ServerEnvelope } from '@claude-usage/shared';
import { getStored, isStale, ageSeconds } from './state.js';

let wss: WebSocketServer | null = null;

export function createWss(server: import('node:http').Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    const stored = getStored();
    if (stored) {
      const msg: ServerEnvelope = {
        type: 'snapshot',
        snapshot: stored.snapshot,
        receivedAt: stored.receivedAt,
        stale: false,
      };
      ws.send(JSON.stringify(msg));
    } else {
      ws.send(JSON.stringify({ type: 'empty' } satisfies ServerEnvelope));
    }

    ws.on('error', () => { /* swallow client errors */ });
  });

  // heartbeat
  const heartbeatInterval = setInterval(() => {
    wss!.clients.forEach((ws) => {
      const extended = ws as WebSocket & { isAlive?: boolean };
      if (extended.isAlive === false) { ws.terminate(); return; }
      extended.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeatInterval));

  // wire up pong
  wss.on('connection', (ws: WebSocket) => {
    const extended = ws as WebSocket & { isAlive?: boolean };
    extended.isAlive = true;
    ws.on('pong', () => { extended.isAlive = true; });
  });
}

export function broadcast(msg: ServerEnvelope): void {
  if (!wss) return;
  const payload = JSON.stringify(msg);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

export function startStaleChecker(staleMs: number, intervalMs: number): void {
  let alreadyBroadcastStale = false;

  setInterval(() => {
    if (isStale(staleMs)) {
      if (!alreadyBroadcastStale) {
        alreadyBroadcastStale = true;
        broadcast({ type: 'stale', receivedAt: getStored()!.receivedAt, ageSeconds: ageSeconds()! });
      }
    } else {
      alreadyBroadcastStale = false;
    }
  }, intervalMs);
}
