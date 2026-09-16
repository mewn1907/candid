// ©️ Mewn

import { describe, it, expect } from 'vitest';
import {
  RoomJoinPayloadSchema,
  RoomRejoinPayloadSchema,
  WebRTCOfferPayloadSchema,
  WebRTCAnswerPayloadSchema,
  WebRTCIceCandidatePayloadSchema,
  CapturePreparePayloadSchema,
  validatePayload,
} from './validation';

describe('capture prepare validation', () => {
  it('accepts each known filter', () => {
    for (const filter of ['natural', 'sepia', 'mono', 'warm']) {
      const result = validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, filter });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filter).toBe(filter);
      }
    }
  });

  it('defaults to natural when no filter is given', () => {
    const result = validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filter).toBe('natural');
    }
  });

  it('rejects unknown filters', () => {
    expect(
      validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, filter: 'xray' }).success,
    ).toBe(false);
  });

  it('defaults burst to a single shot and bounds it to 1-5', () => {
    const def = validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID });
    expect(def.success).toBe(true);
    if (def.success) {
      expect(def.data.burstIndex).toBe(1);
      expect(def.data.burstTotal).toBe(1);
    }
    expect(
      validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, burstIndex: 2, burstTotal: 3 }).success,
    ).toBe(true);
    expect(
      validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, burstIndex: 0, burstTotal: 3 }).success,
    ).toBe(false);
    expect(
      validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, burstIndex: 1, burstTotal: 6 }).success,
    ).toBe(false);
  });

  it('defaults duration to 3s and bounds it to 3-10s', () => {
    const def = validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID });
    expect(def.success).toBe(true);
    if (def.success) {
      expect(def.data.durationSec).toBe(3);
    }
    expect(
      validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, durationSec: 5 }).success,
    ).toBe(true);
    expect(
      validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, durationSec: 2 }).success,
    ).toBe(false);
    expect(
      validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID, durationSec: 11 }).success,
    ).toBe(false);
  });
});

const VALID_ROOM_ID = 'AbcDef1234';

describe('room payload validation', () => {
  it('accepts a well-formed room ID', () => {
    expect(validatePayload(RoomJoinPayloadSchema, { roomId: VALID_ROOM_ID }).success).toBe(true);
    expect(validatePayload(CapturePreparePayloadSchema, { roomId: VALID_ROOM_ID }).success).toBe(true);
    expect(
      validatePayload(RoomRejoinPayloadSchema, { roomId: VALID_ROOM_ID, participantId: 'A' }).success,
    ).toBe(true);
  });

  it('rejects garbage room IDs', () => {
    for (const roomId of ['test', 'bad!!id', 'spaces not ok', '', 'ToolongRoomIdForSure123']) {
      const result = validatePayload(RoomJoinPayloadSchema, { roomId });
      expect(result.success).toBe(false);
    }
  });

  it('rejects room IDs of the wrong length', () => {
    expect(validatePayload(RoomJoinPayloadSchema, { roomId: 'AbcDef123' }).success).toBe(false);
    expect(validatePayload(RoomJoinPayloadSchema, { roomId: 'AbcDef12345' }).success).toBe(false);
  });

  it('rejects invalid participant IDs', () => {
    expect(
      validatePayload(RoomRejoinPayloadSchema, { roomId: VALID_ROOM_ID, participantId: 'C' }).success,
    ).toBe(false);
  });
});

describe('webrtc payload validation', () => {
  it('accepts a minimal valid offer', () => {
    const result = validatePayload(WebRTCOfferPayloadSchema, {
      roomId: VALID_ROOM_ID,
      to: 'B',
      offer: { type: 'offer', sdp: 'v=0\r\n' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a minimal valid answer and ICE candidate', () => {
    expect(
      validatePayload(WebRTCAnswerPayloadSchema, {
        roomId: VALID_ROOM_ID,
        to: 'A',
        answer: { type: 'answer', sdp: 'v=0\r\n' },
      }).success,
    ).toBe(true);
    expect(
      validatePayload(WebRTCIceCandidatePayloadSchema, {
        roomId: VALID_ROOM_ID,
        to: 'A',
        candidate: { candidate: 'candidate:1 1 udp 1 1.2.3.4 5000 typ host' },
      }).success,
    ).toBe(true);
  });

  it('rejects oversized SDP blobs', () => {
    const huge = 'x'.repeat(50001);
    expect(
      validatePayload(WebRTCOfferPayloadSchema, {
        roomId: VALID_ROOM_ID,
        to: 'B',
        offer: { type: 'offer', sdp: huge },
      }).success,
    ).toBe(false);
    expect(
      validatePayload(WebRTCAnswerPayloadSchema, {
        roomId: VALID_ROOM_ID,
        to: 'A',
        answer: { type: 'answer', sdp: huge },
      }).success,
    ).toBe(false);
  });

  it('rejects oversized ICE candidates and bad rooms', () => {
    expect(
      validatePayload(WebRTCIceCandidatePayloadSchema, {
        roomId: VALID_ROOM_ID,
        to: 'A',
        candidate: { candidate: 'x'.repeat(10001) },
      }).success,
    ).toBe(false);
    expect(
      validatePayload(WebRTCOfferPayloadSchema, {
        roomId: 'nope',
        to: 'B',
        offer: { type: 'offer', sdp: 'v=0\r\n' },
      }).success,
    ).toBe(false);
  });
});
