import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { UsageSnapshot, ActiveBlock, DailyPoint, WeeklyTotals } from '@claude-usage/shared';
import { fetchPlanUsage } from './oauth-usage.js';

const execFileAsync = promisify(execFile);

function sevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

async function runCcusage(args: string[]): Promise<unknown> {
  const { stdout } = await execFileAsync(
    'npx',
    ['ccusage@latest', ...args, '--json', '--offline', '--no-color'],
    { timeout: 30_000 },
  );
  return JSON.parse(stdout);
}

type CcBlock = {
  startTime: string;
  actualEndTime: string;
  isActive: boolean;
  tokenCounts: ActiveBlock['tokenCounts'];
  totalTokens: number;
  costUSD: number;
  models: string[];
  burnRate: ActiveBlock['burnRate'];
  projection: ActiveBlock['projection'];
};

type CcWeekRow = {
  week: string;
  totalTokens: number;
  totalCost: number;
};

type CcDayRow = {
  date: string;
  totalTokens: number;
  totalCost: number;
};

export async function fetchSnapshot(host: string, agentVersion: string): Promise<UsageSnapshot> {
  const [blocksRaw, weeklyRaw, dailyRaw, planUsage] = await Promise.all([
    runCcusage(['blocks', '--active']).catch((e): unknown => ({ __error: String(e) })),
    runCcusage(['weekly']).catch((e): unknown => ({ __error: String(e) })),
    runCcusage(['daily', '--since', sevenDaysAgo()]).catch((e): unknown => ({ __error: String(e) })),
    fetchPlanUsage(),
  ]);

  let activeBlock: ActiveBlock | null = null;
  if (blocksRaw && !(blocksRaw as { __error?: string }).__error) {
    const data = blocksRaw as { blocks?: CcBlock[] };
    const block = data.blocks?.[0];
    if (block?.isActive) {
      const endTime = new Date(block.startTime);
      endTime.setHours(endTime.getHours() + 5);
      const remainingMs = endTime.getTime() - Date.now();

      activeBlock = {
        startTime: block.startTime,
        endTime: endTime.toISOString(),
        actualEndTime: block.actualEndTime,
        remainingMinutes: Math.max(0, Math.round(remainingMs / 60_000)),
        tokenCounts: block.tokenCounts,
        totalTokens: block.totalTokens,
        costUSD: block.costUSD,
        models: block.models,
        burnRate: block.burnRate,
        projection: block.projection,
      };
    }
  }

  let weekly: WeeklyTotals | null = null;
  if (weeklyRaw && !(weeklyRaw as { __error?: string }).__error) {
    const data = weeklyRaw as { weekly?: CcWeekRow[] };
    const rows = data.weekly ?? [];
    const last = rows[rows.length - 1];
    if (last) {
      weekly = {
        totalTokens: last.totalTokens,
        totalCostUSD: last.totalCost,
        weekStart: last.week,
      };
    }
  }

  const daily: DailyPoint[] = [];
  if (dailyRaw && !(dailyRaw as { __error?: string }).__error) {
    const data = dailyRaw as { daily?: CcDayRow[] };
    for (const d of data.daily ?? []) {
      daily.push({
        date: d.date,
        totalTokens: d.totalTokens,
        totalCostUSD: d.totalCost,
      });
    }
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: { host, agentVersion },
    activeBlock,
    weekly,
    daily,
    planUsage,
  };
}
