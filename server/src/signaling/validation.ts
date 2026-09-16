// ©️ Mewn

import { z } from 'zod';

// Server generates IDs via nanoid(10): exactly 10 URL-safe chars.
// Anything else can never match a real room, so reject it at validation.
export const RoomIdSchema = z
  .string()
  .length(10, 'Room ID must be exactly 10 characters')
  .regex(/^[A-Za-z0-9_-]{10}$/, 'Room ID contains invalid characters');

// Real SDP blobs are a few KB; cap generously to bound memory/CPU per message.
const SdpSchema = z.string().min(1).max(50000, 'SDP too large');

export const WebRTCOfferPayloadSchema = z.object({
  roomId: RoomIdSchema,
  to: z.enum(['A', 'B']),
  offer: z.object({
    type: z.literal('offer'),
    sdp: SdpSchema,
  }),
});

export const WebRTCAnswerPayloadSchema = z.object({
  roomId: RoomIdSchema,
  to: z.enum(['A', 'B']),
  answer: z.object({
    type: z.literal('answer'),
    sdp: SdpSchema,
  }),
});

export const WebRTCIceCandidatePayloadSchema = z.object({
  roomId: RoomIdSchema,
  to: z.enum(['A', 'B']),
  candidate: z.object({
    candidate: z.string().min(1).max(10000, 'ICE candidate too large'),
    sdpMid: z.string().nullable().optional(),
    sdpMLineIndex: z.number().int().nullable().optional(),
    usernameFragment: z.string().nullable().optional(),
  }),
});

export const PhotoFilterSchema = z.enum(['natural', 'none', 'sepia', 'mono', 'warm', 'clarendon', 'gingham', 'moon', 'lark', 'reyes', 'juno', 'valencia', 'xpro', 'kodachrome', 'velvia']);

export const CapturePreparePayloadSchema = z.object({
  roomId: RoomIdSchema,
  filter: PhotoFilterSchema.optional().default('natural'),
  durationSec: z.number().int().min(3).max(10).optional().default(3),
  burstIndex: z.number().int().min(1).max(5).optional().default(1),
  burstTotal: z.number().int().min(1).max(5).optional().default(1),
});

export const CaptureCompletePayloadSchema = z.object({
  captureId: z.string().min(1).max(100),
  image: z.string().min(1).max(2_000_000),
});

export const CaptureResultPayloadSchema = z.object({
  captureId: z.string().min(1).max(100),
  composedImage: z.string().min(1).max(5_000_000),
});

export const RoomJoinPayloadSchema = z.object({
  roomId: RoomIdSchema,
});

export const RoomRejoinPayloadSchema = z.object({
  roomId: RoomIdSchema,
  participantId: z.enum(['A', 'B']),
});

export type WebRTCOfferPayload = z.infer<typeof WebRTCOfferPayloadSchema>;
export type WebRTCAnswerPayload = z.infer<typeof WebRTCAnswerPayloadSchema>;
export type WebRTCIceCandidatePayload = z.infer<typeof WebRTCIceCandidatePayloadSchema>;
export type CapturePreparePayload = z.infer<typeof CapturePreparePayloadSchema>;
export type CaptureCompletePayload = z.infer<typeof CaptureCompletePayloadSchema>;
export type CaptureResultPayload = z.infer<typeof CaptureResultPayloadSchema>;
export type RoomJoinPayload = z.infer<typeof RoomJoinPayloadSchema>;
export type RoomRejoinPayload = z.infer<typeof RoomRejoinPayloadSchema>;

export function validatePayload<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { success: false, error: `Invalid payload: ${messages}` };
  }
  return { success: true, data: result.data };
}