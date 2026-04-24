import { config as loadEnv } from 'dotenv';
import { hostname } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:8787';
const AGENT_TOKEN = process.env.AGENT_TOKEN ?? '';
const POLL_MS = Number(process.env.POLL_MS ?? 10_000);
const HOST_LABEL = process.env.AGENT_HOST_LABEL || hostname();
const VERSION = '0.1.0';

if (!AGENT_TOKEN) {
  console.error('AGENT_TOKEN env var is required');
  process.exit(1);
}

async function tick(): Promise<void> {
  const { fetchSnapshot } = await import('./ccusage.js');
  const { pushSnapshot } = await import('./push.js');

  try {
    const snapshot = await fetchSnapshot(HOST_LABEL, VERSION);
    await pushSnapshot(SERVER_URL, AGENT_TOKEN, snapshot);
    const tokens = snapshot.activeBlock?.totalTokens ?? 0;
    const cost = snapshot.activeBlock?.costUSD.toFixed(2) ?? '0.00';
    console.log(`[${new Date().toISOString()}] pushed — tokens: ${tokens.toLocaleString()}, cost: $${cost}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] error: ${err}`);
  }
}

console.log(`agent starting — server: ${SERVER_URL}, poll: ${POLL_MS}ms`);
tick();
setInterval(tick, POLL_MS);
