// ©️ Mewn

import { nanoid } from 'nanoid';
import { Room, ParticipantId, CreateRoomResult, JoinRoomResult } from './types';
import { createRoom, getRoom, addParticipant, removeParticipant, getRoomState, getRoomBySocketId } from './room-registry';
import { config } from '../config';

// Per-IP room creation tracking (sliding window). Prevents a single network
// from flooding the in-memory registry. Window length matches room expiry
// so the cap approximates "active rooms created per IP".
const roomCreationsByIp = new Map<string, number[]>();

function isRoomCreationAllowed(clientIp: string): boolean {
  const limit = config.roomLimitPerIp;
  if (limit <= 0) {
    return true;
  }
  const now = Date.now();
  const windowStart = now - config.roomExpirySeconds * 1000;
  const timestamps = (roomCreationsByIp.get(clientIp) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= limit) {
    roomCreationsByIp.set(clientIp, timestamps);
    return false;
  }
  timestamps.push(now);
  roomCreationsByIp.set(clientIp, timestamps);
  return true;
}

// Drops IPs whose creations all fell outside the window, so the map
// cannot grow unboundedly over server lifetime.
export function purgeStaleIpCreations(windowMs: number = config.roomExpirySeconds * 1000): number {
  const windowStart = Date.now() - windowMs;
  let purged = 0;
  for (const [ip, timestamps] of roomCreationsByIp.entries()) {
    const fresh = timestamps.filter((t) => t > windowStart);
    if (fresh.length === 0) {
      roomCreationsByIp.delete(ip);
      purged++;
    } else if (fresh.length !== timestamps.length) {
      roomCreationsByIp.set(ip, fresh);
    }
  }
  return purged;
}

export function handleCreateRoom(clientIp?: string): CreateRoomResult {
  if (clientIp && !isRoomCreationAllowed(clientIp)) {
    return {
      roomId: '',
      participantId: 'A',
      success: false,
      message: 'Room creation limit reached for your network. Please try again later.',
    };
  }
  const roomId = nanoid(10);
  const room = createRoom(roomId);
  const participantId: ParticipantId = 'A';
  return {
    roomId: room.id,
    participantId,
    success: true,
  };
}

export function handleJoinRoom(roomId: string, socketId: string): JoinRoomResult {
  const room = getRoom(roomId);
  if (!room) {
    return {
      room: null,
      participantId: 'A',
      success: false,
      message: 'Room not found',
    };
  }

  if (room.expiresAt <= Date.now()) {
    return {
      room: null,
      participantId: 'A',
      success: false,
      message: 'Room expired',
    };
  }

  if (room.participants.length >= config.maxParticipants) {
    return {
      room: null,
      participantId: 'A',
      success: false,
      message: 'Room is full',
    };
  }

  const existingParticipant = room.participants.find((p) => p.socketId === socketId);
  if (existingParticipant) {
    return {
      room,
      participantId: existingParticipant.id,
      success: true,
    };
  }

  const participantId: ParticipantId = room.participants.length === 0 ? 'A' : 'B';
  const updatedRoom = addParticipant(roomId, socketId, participantId);

  if (!updatedRoom) {
    return {
      room: null,
      participantId: 'A',
      success: false,
      message: 'Failed to join room',
    };
  }

  return {
    room: updatedRoom,
    participantId,
    success: true,
  };
}

export function handleLeaveRoom(socketId: string): Room | null {
  return removeParticipant(socketId);
}

export function handleGetRoomState(roomId: string): ReturnType<typeof getRoomState> {
  return getRoomState(roomId);
}

export function getRoomForSocket(socketId: string): ReturnType<typeof getRoomBySocketId> {
  return getRoomBySocketId(socketId);
}

export function getParticipantIdForSocket(socketId: string): ParticipantId | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;
  const participant = room.participants.find((p) => p.socketId === socketId);
  return participant?.id || null;
}

export interface RejoinRoomResult {
  success: boolean;
  room: Room | null;
  participantId: ParticipantId;
  message?: string;
}

export function handleRejoinRoom(roomId: string, participantId: ParticipantId, socketId: string): RejoinRoomResult {
  const room = getRoom(roomId);
  if (!room) {
    return {
      success: false,
      room: null,
      participantId,
      message: 'Room not found',
    };
  }

  if (room.expiresAt <= Date.now()) {
    return {
      success: false,
      room: null,
      participantId,
      message: 'Room expired',
    };
  }

  // Find the participant by their assigned ID (A or B)
  const existingParticipantIndex = room.participants.findIndex((p) => p.id === participantId);
  if (existingParticipantIndex === -1) {
    return {
      success: false,
      room: null,
      participantId,
      message: 'Participant not found in room',
    };
  }

  // Update the socket ID for this participant (reconnect)
  room.participants[existingParticipantIndex].socketId = socketId;

  return {
    success: true,
    room,
    participantId,
  };
}