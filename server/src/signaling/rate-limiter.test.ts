// ©️ Mewn

import { describe, it, expect } from 'vitest';
import { checkSocketRateLimit, cleanupSocketRateLimit, getRateLimitConfig } from './rate-limiter';

describe('socket rate limiter', () => {
  it('allows up to the limit, then denies', () => {
    const socketId = `sock-limit-${Date.now()}`;
    expect(checkSocketRateLimit(socketId, 'room:create', 2, 60000).allowed).toBe(true);
    expect(checkSocketRateLimit(socketId, 'room:create', 2, 60000).allowed).toBe(true);
    const denied = checkSocketRateLimit(socketId, 'room:create', 2, 60000);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
  });

  it('tracks budgets per event, not per socket', () => {
    const socketId = `sock-events-${Date.now()}`;
    expect(checkSocketRateLimit(socketId, 'room:create', 1, 60000).allowed).toBe(true);
    expect(checkSocketRateLimit(socketId, 'room:create', 1, 60000).allowed).toBe(false);
    expect(checkSocketRateLimit(socketId, 'room:join', 1, 60000).allowed).toBe(true);
  });

  it('resets the budget after cleanup (disconnect)', () => {
    const socketId = `sock-cleanup-${Date.now()}`;
    expect(checkSocketRateLimit(socketId, 'room:create', 1, 60000).allowed).toBe(true);
    expect(checkSocketRateLimit(socketId, 'room:create', 1, 60000).allowed).toBe(false);
    cleanupSocketRateLimit(socketId);
    expect(checkSocketRateLimit(socketId, 'room:create', 1, 60000).allowed).toBe(true);
  });

  it('returns strict budgets for capture events', () => {
    expect(getRateLimitConfig('capture:prepare')).toEqual({ maxRequests: 5, windowMs: 60000 });
    expect(getRateLimitConfig('room:create').maxRequests).toBeLessThanOrEqual(10);
  });
});
