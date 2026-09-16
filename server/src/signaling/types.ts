// ©️ Mewn

import { ParticipantId, Room, Participant } from '../rooms/types';

export interface WebRTCOfferPayload {
  roomId: string;
  to: ParticipantId;
  offer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswerPayload {
  roomId: string;
  to: ParticipantId;
  answer: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidatePayload {
  roomId: string;
  to: ParticipantId;
  candidate: RTCIceCandidateInit;
}

export type PhotoFilterId = 'natural' | 'sepia' | 'mono' | 'warm';

export interface CapturePreparePayload {
  roomId: string;
  filter?: PhotoFilterId;
  durationSec?: number;
  burstIndex?: number;
  burstTotal?: number;
}

export interface CaptureCountdownPayload {
  captureId: string;
  remaining: number;
}

export interface CaptureExecutePayload {
  captureId: string;
}

export interface CaptureCompletePayload {
  captureId: string;
  image: string;
}

export interface CaptureResultPayload {
  captureId: string;
  composedImage: string;
}

export interface ServerToClientEvents {
  'room:created': (data: { roomId: string; participantId: ParticipantId; success: boolean; message?: string }) => void;
  'room:joined': (data: { room: Room | null; participantId: ParticipantId; success: boolean; message?: string }) => void;
  'room:rejoined': (data: { success: boolean; room: Room | null; participantId: ParticipantId; message?: string }) => void;
  'room:participant-joined': (data: { participantId: ParticipantId }) => void;
  'room:participant-left': (data: { participantId: ParticipantId }) => void;
  'room:error': (data: { code: string; message: string }) => void;
  'room:state': (data: { room: Room; participants: Participant[]; canJoin: boolean }) => void;
  'webrtc:offer': (data: { from: ParticipantId; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { from: ParticipantId; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: { from: ParticipantId; candidate: RTCIceCandidateInit }) => void;
  'capture:prepare': (data: { captureId: string; targetTime: number; filter: PhotoFilterId; burstIndex: number; burstTotal: number }) => void;
  'capture:countdown': (data: { captureId: string; remaining: number }) => void;
  'capture:execute': (data: { captureId: string }) => void;
  'capture:complete': (data: { captureId: string; image: string }) => void;
  'capture:result': (data: { captureId: string; composedImage: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': () => void;
  'room:join': (roomId: string) => void;
  'room:rejoin': (data: { roomId: string; participantId: ParticipantId }) => void;
  'webrtc:offer': (data: WebRTCOfferPayload) => void;
  'webrtc:answer': (data: WebRTCAnswerPayload) => void;
  'webrtc:ice-candidate': (data: WebRTCIceCandidatePayload) => void;
  'capture:prepare': (data: CapturePreparePayload) => void;
  'capture:complete': (data: CaptureCompletePayload) => void;
  'capture:result': (data: CaptureResultPayload) => void;
}