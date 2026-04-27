# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Docker + Traefik deployment (alternative)** (`b861005`) — drop-in
  alternative to the direct deploy. `docker compose up -d --build` brings up
  `traefik:v3.3` (stock Docker Hub, Alpine-based) terminating `:80`/`:443`
  with automatic Let's Encrypt HTTPS via the HTTP-01 challenge, in front of
  a small multi-stage `node:22-alpine` image that builds the server inside
  Docker via `pnpm deploy --legacy`. Server runs as the non-root `node`
  user with a read-only filesystem. Agent still runs on the local Claude
  Code machine. New files: `Dockerfile`, `docker-compose.yml`,
  `.dockerignore`, `.env.docker.example`. Zero source-code changes.
- **OLED burn-in protection** (`a3466be`, `0fb3108`) — pure-CSS screen-saver layer
  combining a 1 px pixel orbiter on a 4-direction cycle (60 s/step, 4 min full
  cycle) with a brief once-per-minute brightness pulse (`filter: brightness(0.85)`
  for ≈80 ms). Disabled automatically when the user sets
  `prefers-reduced-motion: reduce`. Documented in the README.
- **Time-remaining visual on the Plan Used card** (`b5ae75a`) — each plan-usage
  row now shows a thin secondary bar with its own elapsed-time percentage
  (`⏱ ▓▓▓░ 62 % · 1h 53m left`), letting you see at a glance whether you are
  burning faster or slower than the 5-hour / 7-day window.

### Changed
- **Burn-rate card layout** (`ee12b9b`) — the model chips were moved out of
  their own row and merged into the cache-hit row, right-aligned. Removes a
  vertical row and pulls the bottom token stats up so they no longer sit too
  low on the card.
- **README screenshots refreshed** (`a1812c0`) — all five theme screenshots
  (`midnight`, `solar`, `terminal`, `paper`, `synthwave`) regenerated against
  the new burn-rate and plan-used layout.

## [0.2.0] — 2026-04-26

### Added
- **Theme switcher with 5 themes** (`3f9a248`) — dropdown menu in the
  upper-right corner. Layout, card positions and data are identical across
  themes; only colors, typography and accents change. Choice persists in
  `localStorage` under `cc-usage-theme`.
  - **Midnight** (dark, default) — calm navy, JetBrains Mono.
  - **Solar** (light) — clean modern UI, indigo accents, Inter.
  - **Terminal** (dark) — CRT phosphor green, square corners, VT323.
  - **Paper** (light) — warm cream, brown/olive serif, Lora.
  - **Synthwave** (dark) — retro neon purple/pink/cyan, Orbitron.
- **README theme documentation** (`26deceb`) — full theme table and a
  screenshot for every variant.

## [0.1.0] — 2026-04-24

### Added
- **Initial project** (`5d7f89b`) — three-package monorepo (`shared/`,
  `agent/`, `server/`, `web/`) implementing the full pipeline:
  - `agent/` polls `ccusage` every 10 s on the Claude Code machine and
    pushes a `UsageSnapshot` to the server.
  - `server/` is a remote-deployable Node HTTP + WebSocket relay that
    fans out the snapshot to connected dashboards and flags it stale
    after `STALE_MS`.
  - `web/` is a Vite + React TV dashboard rendering the active 5-hour
    block, burn rate, weekly totals and a daily bar chart.
  - `shared/` exports the `UsageSnapshot` TypeScript types used by all
    packages.
- **Plan-usage tracking and dotenv integration** (`b084377`) — the agent
  now also reports Claude subscription utilization for the 5-hour window,
  the 7-day all-models window and (when applicable) the 7-day Opus-only
  window. Environment variables are loaded from `.env` in development.
