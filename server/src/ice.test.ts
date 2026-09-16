// ©️ Mewn

import { describe, it, expect } from 'vitest';
import { buildIceServers, isTurnConfigured } from './ice';

describe('buildIceServers', () => {
  it('serves STUN only by default', () => {
    const servers = buildIceServers({
      stunServers: ['stun:stun.l.google.com:19302'],
      turnUrls: '',
      turnUsername: '',
      turnPassword: '',
    });
    expect(servers).toEqual([{ urls: ['stun:stun.l.google.com:19302'] }]);
    expect(isTurnConfigured({
      stunServers: ['stun:stun.l.google.com:19302'],
      turnUrls: '',
      turnUsername: '',
      turnPassword: '',
    })).toBe(false);
  });

  it('includes TURN only when URLs and credentials are all set', () => {
    const servers = buildIceServers({
      stunServers: ['stun:example.com:3478'],
      turnUrls: 'turn:turn.example.com:3478',
      turnUsername: 'user',
      turnPassword: 'pass',
    });
    expect(servers).toHaveLength(2);
    expect(servers[1]).toEqual({
      urls: ['turn:turn.example.com:3478'],
      username: 'user',
      credential: 'pass',
    });
  });

  it('omits TURN when credentials are incomplete', () => {
    const incompletes = [
      { turnUrls: 'turn:turn.example.com:3478', turnUsername: '', turnPassword: '' },
      { turnUrls: 'turn:turn.example.com:3478', turnUsername: 'user', turnPassword: '' },
      { turnUrls: '', turnUsername: 'user', turnPassword: 'pass' },
    ];
    for (const incomplete of incompletes) {
      const cfg = {
        stunServers: ['stun:example.com:3478'],
        turnUrls: incomplete.turnUrls,
        turnUsername: incomplete.turnUsername,
        turnPassword: incomplete.turnPassword,
      };
      expect(buildIceServers(cfg)).toHaveLength(1);
      expect(isTurnConfigured(cfg)).toBe(false);
    }
  });

  it('supports multiple comma-separated STUN and TURN URLs', () => {
    const servers = buildIceServers({
      stunServers: ['stun:a.example:3478', 'stun:b.example:3478'],
      turnUrls: 'turn:t1.example:3478, turns:t2.example:5349',
      turnUsername: 'user',
      turnPassword: 'pass',
    });
    expect(servers[0]).toEqual({ urls: ['stun:a.example:3478', 'stun:b.example:3478'] });
    expect(servers[1].urls).toEqual(['turn:t1.example:3478', 'turns:t2.example:5349']);
  });
});
