import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UsageSnapshot } from '@claude-usage/shared';
import { setSnapshot } from './state.js';
import { broadcast } from './ws.js';

export function handleIngest(
  req: IncomingMessage,
  res: ServerResponse,
  agentToken: string,
): void {
  const auth = req.headers['authorization'] ?? '';
  if (auth !== `Bearer ${agentToken}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  let body = '';
  req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
  req.on('end', () => {
    let snapshot: UsageSnapshot;
    try {
      snapshot = JSON.parse(body) as UsageSnapshot;
      if (snapshot.schemaVersion !== 1) throw new Error('unexpected schemaVersion');
      if (typeof snapshot.generatedAt !== 'string') throw new Error('missing generatedAt');
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid payload', detail: String(err) }));
      return;
    }

    setSnapshot(snapshot);
    const receivedAt = Date.now();
    broadcast({ type: 'snapshot', snapshot, receivedAt, stale: false });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, receivedAt }));
  });
}
