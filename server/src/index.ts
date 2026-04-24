import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStored, isStale, ageSeconds } from './state.js';
import { handleIngest } from './ingest.js';
import { createWss, startStaleChecker } from './ws.js';

const PORT = Number(process.env.PORT ?? 8787);
const AGENT_TOKEN = process.env.AGENT_TOKEN ?? '';
const STALE_MS = Number(process.env.STALE_MS ?? 60_000);
const STALE_CHECK_MS = Number(process.env.STALE_CHECK_MS ?? 15_000);

if (!AGENT_TOKEN) {
  console.error('AGENT_TOKEN env var is required');
  process.exit(1);
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const WEB_DIST = join(__dirname, '..', 'public');

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function serveStatic(res: ServerResponse, urlPath: string): void {
  let filePath = join(WEB_DIST, urlPath === '/' ? 'index.html' : urlPath);
  if (!existsSync(filePath)) filePath = join(WEB_DIST, 'index.html');
  try {
    const content = readFileSync(filePath);
    const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, hasSnapshot: !!getStored(), ageSeconds: ageSeconds() }));
    return;
  }

  if (url === '/api/usage') {
    const stored = getStored();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      snapshot: stored?.snapshot ?? null,
      receivedAt: stored?.receivedAt ?? null,
      stale: stored ? isStale(STALE_MS) : false,
    }));
    return;
  }

  if (url === '/api/ingest' && method === 'POST') {
    handleIngest(req, res, AGENT_TOKEN);
    return;
  }

  if (url.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // serve static in prod
  if (existsSync(WEB_DIST)) {
    serveStatic(res, url);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server running — no web/dist yet. Run `pnpm build` first.');
  }
});

createWss(server);
startStaleChecker(STALE_MS, STALE_CHECK_MS);

server.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
