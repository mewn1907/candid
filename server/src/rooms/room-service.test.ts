// ©️ Mewn

import { describe, it, expect } from 'vitest';
import { config } from '../config';
import { getRoom } from './room-registry';
import { handleCreateRoom, handleJoinRoom, handleRejoinRoom, purgeStaleIpCreations } from './room-service';

let counter = 0;
const testIp = (): string => `10.99.0.${(counter++ % 250) + 1}`;

describe('room-service', () => {
  it('rejects joins to unknown rooms', () => {
    const result = handleJoinRoom('NoSuchRoom', 'sock-unknown');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Room not found');
  });

  it('rejects a third participant in a full room', () => {
    const created = handleCreateRoom(testIp());
    expect(created.success).toBe(true);
    const first = handleJoinRoom(created.roomId, 'sock-full-1');
    expect(first.success).toBe(true);
    expect(first.participantId).toBe('A');
    const second = handleJoinRoom(created.roomId, 'sock-full-2');
    expect(second.success).toBe(true);
    expect(second.participantId).toBe('B');
    const third = handleJoinRoom(created.roomId, 'sock-full-3');
    expect(third.success).toBe(false);
    expect(third.message).toBe('Room is full');
  });

  it('rejects joins to expired rooms', () => {
    const created = handleCreateRoom(testIp());
    const room = getRoom(created.roomId);
    expect(room).toBeDefined();
    room!.expiresAt = Date.now() - 1;
    const result = handleJoinRoom(created.roomId, 'sock-expired');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Room expired');
  });

  it('rejects rejoins to unknown rooms', () => {
    const result = handleRejoinRoom('NoSuchRoom', 'A', 'sock-rejoin');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Room not found');
  });

  it('enforces the per-IP room creation cap', () => {
    const ip = `10.98.0.${counter++}`;
    for (let i = 0; i < config.roomLimitPerIp; i++) {
      expect(handleCreateRoom(ip).success).toBe(true);
    }
    const rejected = handleCreateRoom(ip);
    expect(rejected.success).toBe(false);
    expect(rejected.message).toMatch(/limit/i);
  });

  it('purges stale per-IP entries so capped IPs recover', () => {
    const ip = `10.96.0.${counter++}`;
    for (let i = 0; i < config.roomLimitPerIp; i++) {
      expect(handleCreateRoom(ip).success).toBe(true);
    }
    expect(handleCreateRoom(ip).success).toBe(false);
    expect(purgeStaleIpCreations(0)).toBeGreaterThan(0);
    expect(handleCreateRoom(ip).success).toBe(true);
  });

  it('treats a non-positive per-IP cap as unlimited', () => {
    const previous = config.roomLimitPerIp;
    config.roomLimitPerIp = 0;
    try {
      const ip = `10.97.0.${counter++}`;
      for (let i = 0; i < 3; i++) {
        expect(handleCreateRoom(ip).success).toBe(true);
      }
    } finally {
      config.roomLimitPerIp = previous;
    }
  });
});
