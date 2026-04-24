import { request } from 'undici';
import type { UsageSnapshot } from '@claude-usage/shared';

const MAX_BACKOFF_MS = 60_000;

export async function pushSnapshot(
  serverUrl: string,
  agentToken: string,
  snapshot: UsageSnapshot,
): Promise<void> {
  const url = `${serverUrl.replace(/\/$/, '')}/api/ingest`;
  const body = JSON.stringify(snapshot);

  let delay = 1_000;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const { statusCode } = await request(url, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${agentToken}`,
          'content-type': 'application/json',
        },
        body,
      });

      if (statusCode >= 200 && statusCode < 300) return;
      if (statusCode < 500) {
        throw new Error(`server rejected push: HTTP ${statusCode}`);
      }
      console.warn(`push attempt ${attempt} got HTTP ${statusCode}, retrying in ${delay}ms…`);
    } catch (err) {
      if (attempt === 5) throw err;
      console.warn(`push attempt ${attempt} failed: ${err}, retrying in ${delay}ms…`);
    }

    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, MAX_BACKOFF_MS);
  }
}
