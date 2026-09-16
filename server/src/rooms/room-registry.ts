// ©️ Mewn

import { Room, Participant, ParticipantId } from './types';
import { config } from '../config';

const rooms = new Map<string, Room>();

const participantSockets = new Map<string, { roomId: string; participantId: ParticipantId }>();

export function createRoom(roomId: string): Room {
  const now = Date.now();
  const room: Room = {
    id: roomId,
    participants: [],
    status: 'waiting',
    createdAt: now,
    expiresAt: now + config.roomExpirySeconds * 1000,
  };
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function deleteRoom(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (room) {
    for (const participant of room.participants) {
      participantSockets.delete(participant.socketId);
    }
    return rooms.delete(roomId);
  }
  return false;
}

export function addParticipant(roomId: string, socketId: string, participantId: ParticipantId): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  const participant: Participant = {
    id: participantId,
    socketId,
    joinedAt: Date.now(),
  };

  room.participants.push(participant);
  room.status = room.participants.length >= config.maxParticipants ? 'connected' : 'waiting';
  participantSockets.set(socketId, { roomId, participantId });
  return room;
}

export function removeParticipant(socketId: string): Room | null {
  const mapping = participantSockets.get(socketId);
  if (!mapping) return null;

  const room = rooms.get(mapping.roomId);
  if (!room) {
    participantSockets.delete(socketId);
    return null;
  }

  room.participants = room.participants.filter((p) => p.socketId !== socketId);
  participantSockets.delete(socketId);

  if (room.participants.length === 0) {
    rooms.delete(mapping.roomId);
    return null;
  }

  room.status = room.participants.length >= config.maxParticipants ? 'connected' : 'waiting';
  return room;
}

export function getRoomBySocketId(socketId: string): Room | null {
  const mapping = participantSockets.get(socketId);
  if (!mapping) return null;
  return rooms.get(mapping.roomId) || null;
}

export function getParticipantIdBySocketId(socketId: string): ParticipantId | null {
  const mapping = participantSockets.get(socketId);
  return mapping?.participantId || null;
}

export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

export function cleanupExpiredRooms(): number {
  const now = Date.now();
  let cleaned = 0;
  for (const [roomId, room] of rooms.entries()) {
    if (room.expiresAt <= now) {
      for (const participant of room.participants) {
        participantSockets.delete(participant.socketId);
      }
      rooms.delete(roomId);
      cleaned++;
    }
  }
  return cleaned;
}

export function getRoomState(roomId: string): { room: Room; participants: Participant[]; canJoin: boolean } | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    room,
    participants: room.participants,
    canJoin: room.status === 'waiting' && room.participants.length < config.maxParticipants,
  };
}