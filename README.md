# Claude Code Plan Usage — TV Dashboard

Full-screen dashboard that shows your Claude Code Pro/Max subscription usage in real time on a TV browser.

```
Local machine (Claude Code installed)        Remote server              TV browser
┌────────────────────────────────┐          ┌────────────┐          ┌──────────┐
│  agent — polls ccusage every   │─POST/10s→│  server    │─WebSocket│  web     │
│  10s, pushes to server         │          │  (relay)   │────────▶ │  dashboard│
└────────────────────────────────┘          └────────────┘          └──────────┘
```

## Packages

| Package | Purpose |
|---------|---------|
| `shared/` | Shared TypeScript types (`UsageSnapshot`) |
| `agent/` | Runs on the Claude Code machine — polls `ccusage`, pushes to server |
| `server/` | Remote-deployable Node HTTP + WebSocket server |
| `web/` | Vite + React TV dashboard |

## Quick start (local dev)

```bash
cp .env.example .env
# Edit .env — set AGENT_TOKEN to any random secret

pnpm install
pnpm dev
```

Opens:
- Server: `http://localhost:8787`
- Web dev server: `http://localhost:5173`

## Production deployment

### 1. Build

```bash
pnpm build
```

### 2. Deploy the server

Copy `server/dist/` and `server/node_modules/` to the remote host. Set env vars:

```bash
PORT=8787
AGENT_TOKEN=<same-secret-as-agent>
```

Run: `node server/dist/index.js`

### 3. Run the agent (on your Claude Code machine)

Copy `agent/dist/` and `agent/node_modules/` to the machine where Claude Code is installed. Set env vars:

```bash
SERVER_URL=https://your-server.com
AGENT_TOKEN=<same-secret-as-server>
POLL_MS=10000           # optional, default 10s
AGENT_HOST_LABEL=       # optional, defaults to hostname
```

Run: `node agent/dist/index.js`

To run as a background service on macOS, create a `launchd` plist in `~/Library/LaunchAgents/`.

### 4. Open on TV

Navigate to `https://your-server.com` in a fullscreen/kiosk browser.

## Environment variables

| Var | Default | Where |
|-----|---------|-------|
| `AGENT_TOKEN` | required | both agent & server |
| `PORT` | `8787` | server |
| `STALE_MS` | `60000` | server — ms before snapshot is flagged stale |
| `STALE_CHECK_MS` | `15000` | server — interval to broadcast stale status |
| `SERVER_URL` | `http://localhost:8787` | agent |
| `POLL_MS` | `10000` | agent |
| `AGENT_HOST_LABEL` | `hostname()` | agent |

## Requirements

- Node ≥ 20 on both agent machine and server
- `npx` available on the agent machine (used to run `ccusage@latest`)
- Claude Code installed on the agent machine (`~/.claude/projects/` must exist)
- pnpm ≥ 10 for development
