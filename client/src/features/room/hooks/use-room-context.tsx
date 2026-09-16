// ©️ Mewn

/// <reference types="vite/client" />

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Room,
  RoomState,
  ParticipantId,
  CreateRoomResult,
  JoinRoomResult,
  RoomError,
  PhotoFilterId,
} from '../../../types/room.types';

interface ServerToClientEvents {
  'room:created': (data: CreateRoomResult) => void;
  'room:joined': (data: JoinRoomResult) => void;
  'room:rejoined': (data: { success: boolean; room: Room | null; participantId: ParticipantId; message?: string }) => void;
  'room:participant-joined': (data: { participantId: ParticipantId }) => void;
  'room:participant-left': (data: { participantId: ParticipantId }) => void;
  'room:error': (data: RoomError) => void;
  'room:state': (data: RoomState) => void;
  'webrtc:offer': (data: { from: ParticipantId; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { from: ParticipantId; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: { from: ParticipantId; candidate: RTCIceCandidateInit }) => void;
  'capture:prepare': (data: { captureId: string; targetTime: number }) => void;
  'capture:countdown': (data: { captureId: string; remaining: number }) => void;
  'capture:execute': (data: { captureId: string }) => void;
  'capture:complete': (data: { captureId: string; image: string }) => void;
  // Socket.io built-in events
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_failed: () => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (err: Error) => void;
}

interface ClientToServerEvents {
  'room:create': () => void;
  'room:join': (roomId: string) => void;
  'room:rejoin': (data: { roomId: string; participantId: ParticipantId }) => void;
  'webrtc:offer': (data: { roomId: string; to: ParticipantId; offer: RTCSessionDescriptionInit }) => void;
  'webrtc:answer': (data: { roomId: string; to: ParticipantId; answer: RTCSessionDescriptionInit }) => void;
  'webrtc:ice-candidate': (data: { roomId: string; to: ParticipantId; candidate: RTCIceCandidateInit }) => void;
  'capture:prepare': (data: { roomId: string; filter: PhotoFilterId; durationSec: number }) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface RoomContextType {
  currentRoom: Room | null;
  currentParticipantId: ParticipantId | null;
  loading: boolean;
  error: string | null;
  socket: TypedSocket | null;
  isConnected: boolean;
  apiUrl: string;
  createRoom: () => Promise<CreateRoomResult>;
  joinRoom: (roomId: string) => Promise<JoinRoomResult>;
  leaveRoom: () => void;
  sendWebRTCOffer: (to: ParticipantId, offer: RTCSessionDescriptionInit) => void;
  sendWebRTCAnswer: (to: ParticipantId, answer: RTCSessionDescriptionInit) => void;
  sendICEcandidate: (to: ParticipantId, candidate: RTCIceCandidateInit) => void;
  startCapture: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed) return 'http://localhost:8080';
  // Already absolute URL
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Render fromService may inject short host like candid-server-hb32 without .onrender.com
  let host = trimmed;
  if (!host.includes('.') && /^[a-z0-9-]+$/i.test(host)) {
    host = `${host}.onrender.com`;
  }
  // Fallback for Vercel builds where VITE_API_URL was not set (still localhost) but we're on vercel.app
  const isLocal = host === 'localhost:8080' || host === 'localhost' || host.includes('localhost');
  if (isLocal && typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
    return 'https://candid-server-hb32.onrender.com';
  }
  return `https://${host}`;
}
const _rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_URL = normalizeApiUrl(_rawApiUrl);

const STORAGE_KEYS = {
  ROOM_ID: 'candid_room_id',
  PARTICIPANT_ID: 'candid_participant_id',
} as const;

function saveRoomState(roomId: string, participantId: ParticipantId): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
    sessionStorage.setItem(STORAGE_KEYS.PARTICIPANT_ID, participantId);
  } catch {
    // Ignore storage errors (private browsing, quota exceeded)
  }
}

function clearRoomState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.ROOM_ID);
    sessionStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ID);
  } catch {
    // Ignore storage errors
  }
}

function getStoredRoomState(): { roomId: string | null; participantId: ParticipantId | null } {
  try {
    return {
      roomId: sessionStorage.getItem(STORAGE_KEYS.ROOM_ID),
      participantId: sessionStorage.getItem(STORAGE_KEYS.PARTICIPANT_ID) as ParticipantId | null,
    };
  } catch {
    return { roomId: null, participantId: null };
  }
}

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<ParticipantId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [rejoining, setRejoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Refs mirror state for the mount-once socket effect below. The socket
  // must survive room changes: recreating it on every join would make the
  // server drop the participant (mapped by socket.id) and leave the new
  // socket in no room.
  const currentRoomRef = useRef<Room | null>(null);
  const rejoiningRef = useRef(false);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { rejoiningRef.current = rejoining; }, [rejoining]);

  useEffect(() => {
    const newSocket: TypedSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id, '->', API_URL);
      setIsConnected(true);
      setError(null);
      // Attempt to rejoin if we have stored state and aren't already in a room
      const { roomId, participantId } = getStoredRoomState();
      if (roomId && participantId && !currentRoomRef.current && !rejoiningRef.current) {
        setRejoining(true);
        newSocket.emit('room:rejoin', { roomId, participantId });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err, '->', API_URL);
      setIsConnected(false);
      setError(`Failed to connect to server at ${API_URL}. Check VITE_API_URL and CORS_ORIGIN. (${err.message})`);
    });

    newSocket.on('room:created', (data) => {
      setLoading(false);
      if (data.success) {
        setCurrentRoom({ id: data.roomId, participants: [], status: 'waiting', createdAt: Date.now(), expiresAt: Date.now() + 3600000 });
        setCurrentParticipantId(data.participantId);
        saveRoomState(data.roomId, data.participantId);
        setError(null);
      } else {
        setError(data.message || 'Failed to create room');
      }
    });

    newSocket.on('room:joined', (data) => {
      setLoading(false);
      setRejoining(false);
      if (data.success && data.room) {
        setCurrentRoom(data.room);
        setCurrentParticipantId(data.participantId);
        saveRoomState(data.room.id, data.participantId);
        setError(null);
      } else {
        setError(data.message || 'Failed to join room');
        clearRoomState();
      }
    });

    newSocket.on('room:rejoined', (data: { success: boolean; room: Room | null; participantId: ParticipantId; message?: string }) => {
      setRejoining(false);
      if (data.success && data.room) {
        setCurrentRoom(data.room);
        setCurrentParticipantId(data.participantId);
        saveRoomState(data.room.id, data.participantId);
        setError(null);
      } else {
        setError(data.message || 'Failed to rejoin room');
        clearRoomState();
      }
    });

    newSocket.on('room:participant-joined', (data) => {
      setCurrentRoom((prev) => {
        if (!prev) return prev;
        const newParticipant = { id: data.participantId, role: data.participantId, socketId: '', joinedAt: Date.now() };
        return {
          ...prev,
          participants: [...prev.participants, newParticipant],
          status: 'connected',
        };
      });
    });

    newSocket.on('room:participant-left', (data) => {
      setCurrentRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.filter((p) => p.id !== data.participantId),
          status: prev.participants.length <= 1 ? 'waiting' : prev.status,
        };
      });
    });

    newSocket.on('room:error', (data) => {
      setLoading(false);
      setError(data.message);
    });

    newSocket.on('room:state', (data) => {
      setCurrentRoom(data.room);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('room:created');
      newSocket.off('room:joined');
      newSocket.off('room:rejoined');
      newSocket.off('room:participant-joined');
      newSocket.off('room:participant-left');
      newSocket.off('room:error');
      newSocket.off('room:state');
      newSocket.off('webrtc:offer');
      newSocket.off('webrtc:answer');
      newSocket.off('webrtc:ice-candidate');
      newSocket.off('capture:prepare');
      newSocket.off('capture:countdown');
      newSocket.off('capture:execute');
      newSocket.off('capture:complete');
      newSocket.disconnect();
    };
    // Mount-once: the socket identity must outlive room changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRoom = useCallback(async (): Promise<CreateRoomResult> => {
    if (!socket) throw new Error('Socket not initialized');
    // Wait for an active connection (fixes immediate CreateRoomPage emit
    // racing socket connect, and surfaces deployed misconfig clearly).
    if (!socket.connected) {
      const connected = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 8000);
        socket.once('connect', () => { clearTimeout(timer); resolve(true); });
      });
      if (!connected) {
        const msg = `Cannot reach server at ${API_URL}. Set VITE_API_URL to your deployed server URL and CORS_ORIGIN to your frontend URL, then redeploy.`;
        setLoading(false);
        setError(msg);
        return { roomId: '', participantId: 'A', success: false, message: msg };
      }
    }
    setLoading(true);
    setError(null);
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Room creation timeout');
        resolve({ roomId: '', participantId: 'A', success: false, message: 'Timeout' });
      }, 10000);

      const handler = (data: CreateRoomResult) => {
        clearTimeout(timeout);
        socket.off('room:created', handler);
        resolve(data);
      };
      socket.on('room:created', handler);
      socket.emit('room:create');
    });
  }, [socket]);

  const joinRoom = useCallback(async (roomId: string): Promise<JoinRoomResult> => {
    if (!socket) throw new Error('Socket not initialized');
    if (!socket.connected) {
      const connected = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 8000);
        socket.once('connect', () => { clearTimeout(timer); resolve(true); });
      });
      if (!connected) {
        const msg = `Cannot reach server at ${API_URL}. Set VITE_API_URL to your deployed server URL and CORS_ORIGIN to your frontend URL, then redeploy.`;
        setLoading(false);
        setError(msg);
        return { room: null, participantId: 'A', success: false, message: msg };
      }
    }
    setLoading(true);
    setError(null);
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Room join timeout');
        resolve({ room: null, participantId: 'A', success: false, message: 'Timeout' });
      }, 10000);

      const handler = (data: JoinRoomResult) => {
        clearTimeout(timeout);
        socket.off('room:joined', handler);
        resolve(data);
      };
      socket.on('room:joined', handler);
      socket.emit('room:join', roomId);
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    setCurrentRoom(null);
    setCurrentParticipantId(null);
    setError(null);
    clearRoomState();
  }, [socket]);

  const sendWebRTCOffer = useCallback((to: ParticipantId, offer: RTCSessionDescriptionInit) => {
    if (!socket || !currentRoom) return;
    socket.emit('webrtc:offer', { roomId: currentRoom.id, to, offer });
  }, [socket, currentRoom]);

  const sendWebRTCAnswer = useCallback((to: ParticipantId, answer: RTCSessionDescriptionInit) => {
    if (!socket || !currentRoom) return;
    socket.emit('webrtc:answer', { roomId: currentRoom.id, to, answer });
  }, [socket, currentRoom]);

  const sendICEcandidate = useCallback((to: ParticipantId, candidate: RTCIceCandidateInit) => {
    if (!socket || !currentRoom) return;
    socket.emit('webrtc:ice-candidate', { roomId: currentRoom.id, to, candidate });
  }, [socket, currentRoom]);

  const startCapture = useCallback(() => {
    if (!socket || !currentRoom) return;
    socket.emit('capture:prepare', { roomId: currentRoom.id, filter: 'natural', durationSec: 3 });
  }, [socket, currentRoom]);

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        currentParticipantId,
        loading,
        error,
        socket,
        isConnected,
        apiUrl: API_URL,
        createRoom,
        joinRoom,
        leaveRoom,
        sendWebRTCOffer,
        sendWebRTCAnswer,
        sendICEcandidate,
        startCapture,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = (): RoomContextType => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};