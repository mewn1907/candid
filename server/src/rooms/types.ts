// ©️ Mewn

export type ParticipantId = 'A' | 'B';

export interface Participant {
  id: ParticipantId;
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

export interface CreateRoomResult {
  roomId: string;
  participantId: ParticipantId;
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

export interface RoomState {
  room: Room;
  participants: Participant[];
  canJoin: boolean;
}