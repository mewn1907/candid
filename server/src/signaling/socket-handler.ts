// ©️ Mewn

import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from './types';
import { setupRoomHandlers } from './room-handlers';
import { setupWebRTCHandlers } from './webrtc-handlers';
import { setupCaptureHandlers } from './capture-handlers';
import { cleanupExpiredRooms } from '../rooms/room-registry';
import { purgeStaleCaptures } from './capture-handlers';
import { purgeStaleIpCreations } from '../rooms/room-service';
import { checkSocketRateLimit, cleanupSocketRateLimit, getRateLimitConfig } from './rate-limiter';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const RATE_LIMITED_EVENTS = new Set<keyof ClientToServerEvents>([
  'room:create',
  'room:join',
  'room:rejoin',
  'webrtc:offer',
  'webrtc:answer',
  'webrtc:ice-candidate',
  'capture:prepare',
  'capture:complete',
  'capture:result',
]);

function createRateLimitWrapper(socket: TypedSocket) {
  // The wrapper intentionally erases the typed overloads: rate limiting
  // applies uniformly to string-named events. Runtime behavior is unchanged
  // (pass-through to the real `on`); only this local alias is loosely typed.
  const socketAny = socket as unknown as { on: (eventName: string, listener: (...args: unknown[]) => void) => void };
  const originalOn = socketAny.on.bind(socketAny);
  socketAny.on = ((eventName: string, listener: (...args: unknown[]) => void) => {
    if (RATE_LIMITED_EVENTS.has(eventName as keyof ClientToServerEvents)) {
      const config = getRateLimitConfig(eventName);
      return originalOn(eventName, (...args: unknown[]) => {
        const [data, ack] = args as [unknown, ((response: unknown) => void)?];
        const { allowed, resetTime } = checkSocketRateLimit(socket.id, eventName, config.maxRequests, config.windowMs);
        if (!allowed) {
          const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
          if (ack) {
            ack({ success: false, error: 'Rate limit exceeded', retryAfter });
          }
          socket.emit('room:error', { code: 'RATE_LIMIT_EXCEEDED', message: `Rate limit exceeded for ${eventName}. Try again in ${retryAfter}s.` });
          return;
        }
        listener(data, ack);
      });
    }
    return originalOn(eventName, listener);
  });
}

export function setupSocketHandlers(io: TypedServer): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    createRateLimitWrapper(socket);

    setupRoomHandlers(io, socket);
    setupWebRTCHandlers(io, socket);
    setupCaptureHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
      cleanupSocketRateLimit(socket.id);
    });
  });

  setInterval(() => {
    const cleaned = cleanupExpiredRooms();
    if (cleaned > 0) {
      console.log(`[RoomRegistry] Cleaned up ${cleaned} expired rooms`);
    }
    const purged = purgeStaleCaptures();
    if (purged > 0) {
      console.log(`[Capture] Purged ${purged} stale captures`);
    }
    const purgedIps = purgeStaleIpCreations();
    if (purgedIps > 0) {
      console.log(`[RoomService] Purged ${purgedIps} stale IP entries`);
    }
  }, 60000);
}