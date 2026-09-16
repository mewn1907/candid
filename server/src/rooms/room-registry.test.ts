// ©️ Mewn

import { describe, it, expect } from 'vitest';
import {
  createRoom,
  getRoom,
  deleteRoom,
  addParticipant,
  removeParticipant,
  getRoomBySocketId,
  cleanupExpiredRooms,
  getRoomState,
} from './room-registry';

let counter = 0;
const uid = (prefix: string): string => `${prefix}-${Date.now()}-${counter++}`;

describe('room-registry', () => {
  it('creates a waiting room with expiry', () => {
    const id = uid('create');
    const room = createRoom(id);
    expect(room.id).toBe(id);
    expect(room.status).toBe('waiting');
    expect(room.participants).toHaveLength(0);
    expect(room.expiresAt).toBeGreaterThan(Date.now());
    expect(getRoom(id)).toBe(room);
  });

  it('returns undefined for unknown rooms', () => {
    expect(getRoom(uid('missing'))).toBeUndefined();
  });

  it('transitions waiting -> connected as participants join', () => {
    const id = uid('join');
    createRoom(id);
    const afterA = addParticipant(id, 'sock-a', 'A');
    expect(afterA?.status).toBe('waiting');
    const afterB = addParticipant(id, 'sock-b', 'B');
    expect(afterB?.status).toBe('connected');
    expect(afterB?.participants).toHaveLength(2);
  });

  it('returns null when adding to an unknown room', () => {
    expect(addParticipant(uid('missing'), 'sock-x', 'A')).toBeNull();
  });

  it('removes participants and deletes the room when empty', () => {
    const id = uid('leave');
    createRoom(id);
    addParticipant(id, 'sock-a', 'A');
    addParticipant(id, 'sock-b', 'B');
    const afterLeave = removeParticipant('sock-a');
    expect(afterLeave?.status).toBe('waiting');
    expect(afterLeave?.participants).toHaveLength(1);
    expect(getRoomBySocketId('sock-a')).toBeNull();
    expect(removeParticipant('sock-b')).toBeNull();
    expect(getRoom(id)).toBeUndefined();
  });

  it('returns null when removing an unknown socket', () => {
    expect(removeParticipant('never-connected')).toBeNull();
  });

  it('maps sockets to rooms', () => {
    const id = uid('map');
    createRoom(id);
    addParticipant(id, 'sock-map', 'A');
    expect(getRoomBySocketId('sock-map')?.id).toBe(id);
    expect(getRoomBySocketId('unknown-sock')).toBeNull();
  });

  it('deleteRoom removes the room and its socket mappings', () => {
    const id = uid('delete');
    createRoom(id);
    addParticipant(id, 'sock-del', 'A');
    expect(deleteRoom(id)).toBe(true);
    expect(getRoom(id)).toBeUndefined();
    expect(getRoomBySocketId('sock-del')).toBeNull();
    expect(deleteRoom(id)).toBe(false);
  });

  it('cleanupExpiredRooms removes only expired rooms', () => {
    const expiredId = uid('expired');
    const freshId = uid('fresh');
    const expired = createRoom(expiredId);
    createRoom(freshId);
    expired.expiresAt = Date.now() - 1;
    expect(cleanupExpiredRooms()).toBeGreaterThanOrEqual(1);
    expect(getRoom(expiredId)).toBeUndefined();
    expect(getRoom(freshId)).toBeDefined();
  });

  it('getRoomState reports joinability', () => {
    const id = uid('state');
    createRoom(id);
    expect(getRoomState(id)?.canJoin).toBe(true);
    addParticipant(id, 'sock-s1', 'A');
    expect(getRoomState(id)?.canJoin).toBe(true);
    addParticipant(id, 'sock-s2', 'B');
    expect(getRoomState(id)?.canJoin).toBe(false);
    expect(getRoomState(uid('missing'))).toBeNull();
  });
});
