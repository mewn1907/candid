// ©️ Mewn

import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents } from './types';
import { getRoomForSocket, getParticipantIdForSocket } from '../rooms/room-service';
import { CapturePreparePayloadSchema, CaptureCompletePayloadSchema, CaptureResultPayloadSchema, validatePayload } from './validation';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface PendingCapture {
  captureId: string;
  targetTime: number;
  interval: NodeJS.Timeout;
  imagesReceived: Set<string>;
}

const pendingCaptures = new Map<string, PendingCapture>();

function sendError(socket: TypedSocket, message: string): void {
  socket.emit('room:error', { code: 'INVALID_PAYLOAD', message });
}

// captureId is `${roomId}-${Date.now()}` and room IDs may contain '-'
// (nanoid alphabet), so ownership must be checked by prefix.
export function isCaptureIdForRoom(captureId: string, roomId: string): boolean {
  return captureId.startsWith(`${roomId}-`);
}

export function setupCaptureHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('capture:prepare', (data: { roomId: string; filter?: string }) => {
    const validation = validatePayload(CapturePreparePayloadSchema, data);
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }

    const room = getRoomForSocket(socket.id);
    if (!room || room.id !== validation.data.roomId) return;

    const participantId = getParticipantIdForSocket(socket.id);
    if (!participantId) return;

    const captureId = `${room.id}-${Date.now()}`;
    const targetTime = Date.now() + validation.data.durationSec * 1000;

    const interval = setInterval(() => {
      const remaining = Math.ceil((targetTime - Date.now()) / 1000);
      if (remaining >= 0) {
        io.to(room.id).emit('capture:countdown', { captureId, remaining });
      } else {
        clearInterval(interval);
        io.to(room.id).emit('capture:execute', { captureId });
      }
    }, 1000);

    pendingCaptures.set(captureId, {
      captureId,
      targetTime,
      interval,
      imagesReceived: new Set(),
    });

    io.to(room.id).emit('capture:prepare', {
      captureId,
      targetTime,
      filter: validation.data.filter,
      burstIndex: validation.data.burstIndex,
      burstTotal: validation.data.burstTotal,
    });
  });

  socket.on('capture:complete', (data: { captureId: string; image: string }) => {
    const validation = validatePayload(CaptureCompletePayloadSchema, data);
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }

    const pending = pendingCaptures.get(validation.data.captureId);
    if (!pending) return;

    const room = getRoomForSocket(socket.id);
    if (!room || !isCaptureIdForRoom(validation.data.captureId, room.id)) return;

    const participantId = getParticipantIdForSocket(socket.id);
    if (!participantId) return;

    pending.imagesReceived.add(participantId);

    socket.to(room.id).emit('capture:complete', validation.data);
    // NOTE: the pending entry is deleted when the first capture:result is
    // broadcast (or by purgeStaleCaptures), NOT here — both clients compose
    // locally and emit their result after both images arrive, so deleting
    // here would drop both results.
  });

  socket.on('capture:result', (data: { captureId: string; composedImage: string }) => {
    const validation = validatePayload(CaptureResultPayloadSchema, data);
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }

    const pending = pendingCaptures.get(validation.data.captureId);
    if (!pending) return;

    const room = getRoomForSocket(socket.id);
    if (!room || !isCaptureIdForRoom(validation.data.captureId, room.id)) return;

    io.to(room.id).emit('capture:result', validation.data);
    pendingCaptures.delete(validation.data.captureId);
  });

  // NOTE: no per-socket disconnect cleanup here. imagesReceived holds
  // participant IDs (not socket IDs), so matching by socket.id can never
  // work. Stale captures are reaped by purgeStaleCaptures() below.
}

// Reaps captures older than maxAgeMs past their target time. Prevents
// unbounded growth when clients vanish mid-flow without a result.
export function purgeStaleCaptures(maxAgeMs = 120_000): number {
  const now = Date.now();
  let purged = 0;
  for (const [captureId, pending] of pendingCaptures.entries()) {
    if (now - pending.targetTime > maxAgeMs) {
      clearInterval(pending.interval);
      pendingCaptures.delete(captureId);
      purged++;
    }
  }
  return purged;
}