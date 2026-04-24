import type { UsageSnapshot } from '@claude-usage/shared';

type StoredSnapshot = {
  snapshot: UsageSnapshot;
  receivedAt: number;
};

let stored: StoredSnapshot | null = null;

export function setSnapshot(snapshot: UsageSnapshot): void {
  stored = { snapshot, receivedAt: Date.now() };
}

export function getStored(): StoredSnapshot | null {
  return stored;
}

export function isStale(staleMs: number): boolean {
  if (!stored) return false;
  return Date.now() - stored.receivedAt > staleMs;
}

export function ageSeconds(): number | null {
  if (!stored) return null;
  return Math.round((Date.now() - stored.receivedAt) / 1000);
}
