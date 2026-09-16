// ©️ Mewn

import { config } from '../config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, Map<string, RateLimitEntry>>();

export function checkSocketRateLimit(socketId: string, eventName: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let socketLimits = rateLimitStore.get(socketId);

  if (!socketLimits) {
    socketLimits = new Map();
    rateLimitStore.set(socketId, socketLimits);
  }

  const eventLimit = socketLimits.get(eventName);

  if (!eventLimit || now > eventLimit.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    socketLimits.set(eventName, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetTime: newEntry.resetTime };
  }

  if (eventLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: eventLimit.resetTime };
  }

  eventLimit.count++;
  return { allowed: true, remaining: maxRequests - eventLimit.count, resetTime: eventLimit.resetTime };
}

export function cleanupSocketRateLimit(socketId: string): void {
  rateLimitStore.delete(socketId);
}

export function getRateLimitConfig(eventName: string): { maxRequests: number; windowMs: number } {
  switch (eventName) {
    case 'room:create':
      return { maxRequests: 10, windowMs: 60000 };
    case 'room:join':
      return { maxRequests: 30, windowMs: 60000 };
    case 'room:rejoin':
      return { maxRequests: 10, windowMs: 60000 };
    case 'webrtc:offer':
    case 'webrtc:answer':
    case 'webrtc:ice-candidate':
      return { maxRequests: 60, windowMs: 1000 };
    case 'capture:prepare':
      return { maxRequests: 5, windowMs: 60000 };
    case 'capture:complete':
      return { maxRequests: 10, windowMs: 60000 };
    case 'capture:result':
      return { maxRequests: 10, windowMs: 60000 };
    default:
      return { maxRequests: config.rateLimitMaxRequests, windowMs: config.rateLimitTimeWindow };
  }
}