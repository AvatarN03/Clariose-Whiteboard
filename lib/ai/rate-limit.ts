type RateLimitBucket = {
  timestamps: number[];
};

export type AiRateLimitResult = {
  allowed: boolean;
  scope?: "user" | "project";
  retryAfterSeconds?: number;
  userLimit: number;
  projectLimit: number;
};

const WINDOW_MS = 60_000;
const buckets = new Map<string, RateLimitBucket>();

function envLimit(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.min(100, Math.max(1, Math.floor(value))) : fallback;
}

function getActiveTimestamps(key: string, now: number): number[] {
  const bucket = buckets.get(key);
  const active = bucket?.timestamps.filter((timestamp) => timestamp > now - WINDOW_MS) ?? [];
  buckets.set(key, { timestamps: active });
  return active;
}

export function consumeAiRateLimit(userKey: string, projectKey: string, now = Date.now()): AiRateLimitResult {
  const userLimit = envLimit("AI_RATE_LIMIT_PER_USER_PER_MINUTE", 10);
  const projectLimit = envLimit("AI_RATE_LIMIT_PER_PROJECT_PER_MINUTE", 20);
  const userTimestamps = getActiveTimestamps(`user:${userKey}`, now);
  const projectTimestamps = getActiveTimestamps(`project:${projectKey}`, now);

  if (userTimestamps.length >= userLimit) {
    return {
      allowed: false,
      scope: "user",
      retryAfterSeconds: Math.max(1, Math.ceil((userTimestamps[0] + WINDOW_MS - now) / 1000)),
      userLimit,
      projectLimit,
    };
  }
  if (projectTimestamps.length >= projectLimit) {
    return {
      allowed: false,
      scope: "project",
      retryAfterSeconds: Math.max(1, Math.ceil((projectTimestamps[0] + WINDOW_MS - now) / 1000)),
      userLimit,
      projectLimit,
    };
  }

  userTimestamps.push(now);
  projectTimestamps.push(now);
  return { allowed: true, userLimit, projectLimit };
}

export function resetAiRateLimitForTests() {
  buckets.clear();
}
