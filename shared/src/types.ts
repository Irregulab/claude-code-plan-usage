export type TokenCounts = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
};

export type ActiveBlock = {
  startTime: string;
  endTime: string;
  actualEndTime: string;
  remainingMinutes: number;
  tokenCounts: TokenCounts;
  totalTokens: number;
  costUSD: number;
  models: string[];
  burnRate: {
    tokensPerMinute: number;
    costPerHour: number;
  };
  projection: {
    totalTokens: number;
    totalCost: number;
  };
};

export type DailyPoint = {
  date: string;
  totalTokens: number;
  totalCostUSD: number;
};

export type WeeklyTotals = {
  totalTokens: number;
  totalCostUSD: number;
  weekStart: string;
};

export type UsageSnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    host: string;
    agentVersion: string;
  };
  activeBlock: ActiveBlock | null;
  weekly: WeeklyTotals | null;
  daily: DailyPoint[];
};

export type ServerEnvelope =
  | { type: 'snapshot'; snapshot: UsageSnapshot; receivedAt: number; stale: false }
  | { type: 'stale'; receivedAt: number; ageSeconds: number }
  | { type: 'empty' };
