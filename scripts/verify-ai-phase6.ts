import assert from "node:assert/strict";
import { consumeAiRateLimit, resetAiRateLimitForTests } from "../lib/ai/rate-limit";

process.env.AI_RATE_LIMIT_PER_USER_PER_MINUTE = "2";
process.env.AI_RATE_LIMIT_PER_PROJECT_PER_MINUTE = "3";
resetAiRateLimitForTests();

const first = consumeAiRateLimit("user-1", "project-1", 1_000);
const second = consumeAiRateLimit("user-1", "project-1", 2_000);
const userLimited = consumeAiRateLimit("user-1", "project-1", 3_000);
assert.equal(first.allowed, true);
assert.equal(second.allowed, true);
assert.equal(userLimited.allowed, false);
assert.equal(userLimited.scope, "user");

resetAiRateLimitForTests();
const projectFirst = consumeAiRateLimit("user-1", "project-2", 1_000);
const projectSecond = consumeAiRateLimit("user-2", "project-2", 2_000);
const projectThird = consumeAiRateLimit("user-3", "project-2", 3_000);
assert.equal(projectFirst.allowed, true);
assert.equal(projectSecond.allowed, true);
assert.equal(projectThird.allowed, true);
assert.equal(consumeAiRateLimit("user-4", "project-2", 4_000).allowed, false);

assert.equal(consumeAiRateLimit("user-5", "project-3", 62_000).allowed, true);
console.log("Phase 6 AI safety checks passed.");
