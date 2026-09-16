// ©️ Mewn

export type ParticipantId = 'A' | 'B';

export type ParticipantRole = ParticipantId;

export interface Participant {
  id: ParticipantId;
  role: ParticipantRole;
  socketId: string;
  joinedAt: number;
}

export type RoomStatus = 'waiting' | 'connected' | 'capturing' | 'completed' | 'expired';

export interface Room {
  id: string;
  participants: Participant[];
  status: RoomStatus;
  createdAt: number;
  expiresAt: number;
}

export interface RoomState {
  room: Room;
  participants: Participant[];
  canJoin: boolean;
  localRole?: ParticipantId;
}

export interface CreateRoomResponse {
  roomId: string;
  participantId: ParticipantId;
  participantRole: ParticipantId;
  success: boolean;
  message?: string;
}

export interface CreateRoomResult {
  roomId: string;
  participantId: ParticipantId;
  success: boolean;
  message?: string;
}

export interface JoinRoomRequest {
  roomId: string;
}

export interface JoinRoomResponse {
  room: Room;
  participantId: ParticipantId;
  participantRole: ParticipantId;
  success: boolean;
  message?: string;
}

export interface JoinRoomResult {
  room: Room | null;
  participantId: ParticipantId;
  success: boolean;
  message?: string;
}

export type RoomErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_EXPIRED'
  | 'INVALID_ROOM_ID'
  | 'PARTICIPANT_ALREADY_IN_ROOM'
  | 'SERVER_ERROR';

export interface RoomError {
  code: RoomErrorCode;
  message: string;
}

export type CameraErrorCode =
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'CAMERA_IN_USE'
  | 'UNSUPPORTED_BROWSER'
  | 'STREAM_STOPPED'
  | 'DEVICE_DISCONNECTED'
  | 'UNKNOWN_ERROR';

export interface CameraError {
  code: CameraErrorCode;
  message: string;
}

export interface CameraState {
  stream: MediaStream | null;
  error: CameraError | null;
  loading: boolean;
  facingMode: 'user' | 'environment';
}

export interface CameraConstraints {
  video: {
    facingMode: 'user' | 'environment';
    width: { ideal: number };
    height: { ideal: number };
  };
  audio: boolean;
}

export type WebRTCErrorCode =
  | 'PEER_CONNECTION_FAILED'
  | 'ICE_GATHERING_FAILED'
  | 'OFFER_CREATION_FAILED'
  | 'ANSWER_CREATION_FAILED'
  | 'ICE_CANDIDATE_ERROR'
  | 'CONNECTION_TIMEOUT'
  | 'REMOTE_STREAM_FAILED';

export interface WebRTCError {
  code: WebRTCErrorCode;
  message: string;
}

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: ConnectionState;
  error: WebRTCError | null;
  iceConnectionState: RTCIceConnectionState;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

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

export type CaptureState = 'idle' | 'preparing' | 'countdown' | 'capturing' | 'composing' | 'result' | 'gallery';

export type PhotoFilterId = 'natural' | 'sepia' | 'mono' | 'warm' | 'clarendon' | 'gingham' | 'moon' | 'lark' | 'reyes' | 'juno' | 'valencia' | 'xpro';

export type CaptureErrorCode =
  | 'CAPTURE_TIMEOUT'
  | 'CAPTURE_FAILED'
  | 'COMPOSITION_FAILED'
  | 'PEER_IMAGE_MISSING'
  | 'INVALID_STATE_TRANSITION';

export interface CaptureError {
  code: CaptureErrorCode;
  message: string;
}

export interface CaptureStateInfo {
  state: CaptureState;
  captureId: string | null;
  targetTime: number | null;
  countdown: number | null;
  localImage: string | null;
  remoteImage: string | null;
  composedImage: string | null;
  error: CaptureError | null;
}

export interface CapturePreparePayload {
  captureId: string;
  targetTime: number;
  filter: PhotoFilterId;
  burstIndex: number;
  burstTotal: number;
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