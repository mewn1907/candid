// ©️ Mewn

import { Server, Socket } from 'socket.io';
import { ServerToClientEvents, ClientToServerEvents, WebRTCOfferPayload, WebRTCAnswerPayload, WebRTCIceCandidatePayload } from './types';
import { getRoomForSocket, getParticipantIdForSocket } from '../rooms/room-service';
import { WebRTCOfferPayloadSchema, WebRTCAnswerPayloadSchema, WebRTCIceCandidatePayloadSchema, validatePayload } from './validation';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function sendError(socket: TypedSocket, message: string): void {
  socket.emit('room:error', { code: 'INVALID_PAYLOAD', message });
}

export function setupWebRTCHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('webrtc:offer', (data: WebRTCOfferPayload) => {
    const validation = validatePayload(WebRTCOfferPayloadSchema, data);
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }

    const room = getRoomForSocket(socket.id);
    if (!room) return;

    const fromParticipantId = getParticipantIdForSocket(socket.id);
    if (!fromParticipantId) return;

    socket.to(validation.data.roomId).emit('webrtc:offer', {
      from: fromParticipantId,
      offer: validation.data.offer,
    });
  });

  socket.on('webrtc:answer', (data: WebRTCAnswerPayload) => {
    const validation = validatePayload(WebRTCAnswerPayloadSchema, data);
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }

    const room = getRoomForSocket(socket.id);
    if (!room) return;

    const fromParticipantId = getParticipantIdForSocket(socket.id);
    if (!fromParticipantId) return;

    socket.to(validation.data.roomId).emit('webrtc:answer', {
      from: fromParticipantId,
      answer: validation.data.answer,
    });
  });

  socket.on('webrtc:ice-candidate', (data: WebRTCIceCandidatePayload) => {
    const validation = validatePayload(WebRTCIceCandidatePayloadSchema, data);
    if (!validation.success) {
      sendError(socket, validation.error);
      return;
    }

    const room = getRoomForSocket(socket.id);
    if (!room) return;

    const fromParticipantId = getParticipantIdForSocket(socket.id);
    if (!fromParticipantId) return;

    socket.to(validation.data.roomId).emit('webrtc:ice-candidate', {
      from: fromParticipantId,
      candidate: validation.data.candidate,
    });
  });
}