import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import type { PlanUsage, PlanUtilization } from '@claude-usage/shared';

const execFileAsync = promisify(execFile);

const ENDPOINT = 'https://api.anthropic.com/api/oauth/usage';
const BETA_HEADER = 'oauth-2025-04-20';

type RawUsage = {
  utilization?: number;
  resets_at?: string;
} | null | undefined;

type RawResponse = {
  five_hour?: RawUsage;
  seven_day?: RawUsage;
  seven_day_opus?: RawUsage;
};

type StoredCreds = {
  claudeAiOauth?: { accessToken?: string };
  accessToken?: string;
};

async function readTokenFromKeychain(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('security', [
      'find-generic-password',
      '-a', process.env.USER ?? '',
      '-s', 'Claude Code-credentials',
      '-w',
    ], { timeout: 5_000 });
    const parsed = JSON.parse(stdout.trim()) as StoredCreds;
    return parsed.claudeAiOauth?.accessToken ?? parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

async function readTokenFromFile(): Promise<string | null> {
  try {
    const dir = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude');
    const raw = await readFile(join(dir, '.credentials.json'), 'utf8');
    const parsed = JSON.parse(raw) as StoredCreds;
    return parsed.claudeAiOauth?.accessToken ?? parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function getOauthToken(): Promise<string | null> {
  if (process.env.CLAUDE_OAUTH_TOKEN) return process.env.CLAUDE_OAUTH_TOKEN;
  if (platform() === 'darwin') {
    const kc = await readTokenFromKeychain();
    if (kc) return kc;
  }
  return readTokenFromFile();
}

function toUtil(raw: RawUsage): PlanUtilization | null {
  if (!raw || typeof raw.utilization !== 'number') return null;
  return { utilization: raw.utilization, resetsAt: raw.resets_at ?? null };
}

type Cached = { at: number; value: PlanUsage };
let cached: Cached | null = null;
let nextAllowedAt = 0;

const DEFAULT_INTERVAL_MS = 5 * 60_000;
const BACKOFF_ON_429_MS = 10 * 60_000;

function intervalMs(): number {
  const n = Number(process.env.PLAN_USAGE_POLL_MS);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_INTERVAL_MS;
}

async function fetchFresh(): Promise<PlanUsage> {
  const empty: PlanUsage = { fiveHour: null, sevenDay: null, sevenDayOpus: null, error: null };
  const token = await getOauthToken();
  if (!token) return { ...empty, error: 'no oauth token (not logged into Claude Code)' };

  try {
    const res = await fetch(ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'anthropic-beta': BETA_HEADER,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (res.status === 429) {
      nextAllowedAt = Date.now() + BACKOFF_ON_429_MS;
      return { ...empty, error: 'rate limited by Anthropic (backing off 10m)' };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ...empty, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as RawResponse;
    return {
      fiveHour: toUtil(data.five_hour),
      sevenDay: toUtil(data.seven_day),
      sevenDayOpus: toUtil(data.seven_day_opus),
      error: null,
    };
  } catch (err) {
    return { ...empty, error: `fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function fetchPlanUsage(): Promise<PlanUsage> {
  const now = Date.now();
  const cacheFresh = cached && now - cached.at < intervalMs();
  const inBackoff = now < nextAllowedAt;

  if (cacheFresh || inBackoff) {
    if (cached) return cached.value;
    return { fiveHour: null, sevenDay: null, sevenDayOpus: null, error: 'rate limited, no cached data yet' };
  }

  const fresh = await fetchFresh();
  if (!fresh.error || fresh.fiveHour || fresh.sevenDay) {
    cached = { at: now, value: fresh };
  } else if (cached) {
    return { ...cached.value, error: fresh.error };
  }
  return fresh;
}
