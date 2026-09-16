// ©️ Mewn

import { Server, Socket } from 'socket.io';
import { handleCreateRoom, handleJoinRoom, handleLeaveRoom, handleRejoinRoom, getParticipantIdForSocket } from '../rooms/room-service';
import { ServerToClientEvents, ClientToServerEvents } from './types';
import { ParticipantId } from '../rooms/types';
import { RoomJoinPayloadSchema, RoomRejoinPayloadSchema, validatePayload } from './validation';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function sendError(socket: TypedSocket, message: string): void {
  socket.emit('room:error', { code: 'INVALID_PAYLOAD', message });
}

export function setupRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('room:create', () => {
    const result = handleCreateRoom(socket.handshake.address, socket.id);
    if (result.success) {
      socket.join(result.roomId);
    }
    socket.emit('room:created', result);
  });

  socket.on('room:join', (roomId: string) => {
    const validation = validatePayload(RoomJoinPayloadSchema, { roomId });
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }
    const result = handleJoinRoom(validation.data.roomId, socket.id);
    if (result.success && result.room) {
      socket.join(result.room.id);
    }
    socket.emit('room:joined', result);

    if (result.success && result.room) {
      socket.to(result.room.id).emit('room:participant-joined', {
        participantId: result.participantId,
      });
    }
  });

  socket.on('room:rejoin', (data: { roomId: string; participantId: ParticipantId }) => {
    const validation = validatePayload(RoomRejoinPayloadSchema, data);
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }
    const result = handleRejoinRoom(validation.data.roomId, validation.data.participantId, socket.id);
    if (result.success && result.room) {
      socket.join(result.room.id);
    }
    socket.emit('room:rejoined', result);

    if (result.success && result.room) {
      socket.to(result.room.id).emit('room:participant-joined', {
        participantId: result.participantId,
      });
    }
  });

  socket.on('disconnect', () => {
    const participantId = getParticipantIdForSocket(socket.id);
    const room = handleLeaveRoom(socket.id);

    if (room && participantId) {
      io.to(room.id).emit('room:participant-left', { participantId });
    }
  });
}