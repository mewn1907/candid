// ©️ Mewn

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WebRTCState,
  WebRTCError,
  ConnectionState,
  WebRTCOfferPayload,
  WebRTCAnswerPayload,
  WebRTCIceCandidatePayload,
  ParticipantId,
} from '../../../types/room.types';
import { Socket } from 'socket.io-client';

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed) return 'http://localhost:8080';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  let host = trimmed;
  if (!host.includes('.') && /^[a-z0-9-]+$/i.test(host)) {
    host = `${host}.onrender.com`;
  }
  const isLocal = host === 'localhost:8080' || host === 'localhost' || host.includes('localhost');
  if (isLocal && typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
    return 'https://candid-server-hb32.onrender.com';
  }
  return `https://${host}`;
}
const _rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_URL = normalizeApiUrl(_rawApiUrl);

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

// Fetched once per page load; falls back to public STUN when unreachable.
let cachedIceServers: Promise<RTCIceServer[]> | null = null;

function fetchIceServers(): Promise<RTCIceServer[]> {
  if (!cachedIceServers) {
    cachedIceServers = fetch(`${API_URL}/ice-servers`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`ICE config request failed: ${res.status}`);
        const data = (await res.json()) as { iceServers?: unknown };
        if (!Array.isArray(data.iceServers) || data.iceServers.length === 0) {
          throw new Error('Empty ICE server list');
        }
        return (data.iceServers as RTCIceServer[]).filter(
          (s): s is RTCIceServer => !!s && typeof s === 'object' && 'urls' in s
        );
      })
      .catch((err) => {
        console.warn('[WebRTC] Using fallback ICE servers:', err);
        return FALLBACK_ICE_SERVERS;
      });
  }
  return cachedIceServers;
}

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 3;

export function useWebRTC(
  socket: Socket | null,
  currentRoomId: string | null,
  localParticipantId: ParticipantId | null,
  localStream: MediaStream | null
): WebRTCState & {
  createOffer: () => Promise<void>;
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<void>;
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  cleanup: () => void;
  restartICE: () => Promise<void>;
} {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('new');
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');
  const [error, setError] = useState<WebRTCError | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const isRestartingRef = useRef(false);
  const localStreamRef = useRef(localStream);
  const socketRef = useRef(socket);
  const currentRoomIdRef = useRef(currentRoomId);
  const localParticipantIdRef = useRef(localParticipantId);

  // Keep refs updated
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { currentRoomIdRef.current = currentRoomId; }, [currentRoomId]);
  useEffect(() => { localParticipantIdRef.current = localParticipantId; }, [localParticipantId]);

  const createPeerConnection = useCallback(async () => {
    const iceServers = await fetchIceServers();
    const config: RTCConfiguration = {
      iceServers,
      iceCandidatePoolSize: 10,
    };

    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);

      // Trigger ICE restart if connection fails
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.log('[WebRTC] ICE connection failed/disconnected, scheduling restart');
        scheduleICERestart();
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState as ConnectionState);
      console.log('[WebRTC] Connection state:', pc.connectionState);

      if (pc.connectionState === 'failed') {
        setError({
          code: 'PEER_CONNECTION_FAILED',
          message: 'Peer connection failed. Attempting to reconnect...',
        });
        scheduleICERestart();
      } else if (pc.connectionState === 'connected') {
        reconnectAttemptsRef.current = 0;
        setError(null);
      }
    };

    pc.onicecandidate = (event) => {
      const socket = socketRef.current;
      const currentRoomId = currentRoomIdRef.current;
      const localParticipantId = localParticipantIdRef.current;
      if (event.candidate && socket && currentRoomId && localParticipantId) {
        const targetParticipant = localParticipantId === 'A' ? 'B' : 'A';
        socket.emit('webrtc:ice-candidate', {
          roomId: currentRoomId,
          to: targetParticipant,
          candidate: event.candidate.toJSON(),
        } as WebRTCIceCandidatePayload);
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received');
      const stream = event.streams[0];
      setRemoteStream(stream);
    };

    // Add local tracks if available
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    return pc;
  }, []);

  const scheduleICERestart = useCallback(() => {
    if (isRestartingRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setError({
        code: 'PEER_CONNECTION_FAILED',
        message: 'Max reconnection attempts reached. Please refresh the page.',
      });
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;
    console.log(`[WebRTC] Scheduling ICE restart in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

    setTimeout(() => {
      restartICE().catch((err) => {
        console.error('[WebRTC] ICE restart failed:', err);
      });
    }, delay);
  }, []);

  const restartICE = useCallback(async () => {
    if (isRestartingRef.current) return;
    isRestartingRef.current = true;

    const pc = peerConnectionRef.current;
    const socket = socketRef.current;
    const currentRoomId = currentRoomIdRef.current;
    const localParticipantId = localParticipantIdRef.current;

    if (!pc || !socket || !currentRoomId || !localParticipantId) {
      isRestartingRef.current = false;
      return;
    }

    console.log('[WebRTC] Restarting ICE...');
    setError(null);

    try {
      // Create a new offer with ICE restart flag
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);

      const targetParticipant = localParticipantId === 'A' ? 'B' : 'A';
      socket.emit('webrtc:offer', {
        roomId: currentRoomId,
        to: targetParticipant,
        offer: pc.localDescription!.toJSON(),
      } as WebRTCOfferPayload);

      console.log('[WebRTC] ICE restart offer sent');
    } catch (err) {
      console.error('[WebRTC] ICE restart failed:', err);
      setError({ code: 'PEER_CONNECTION_FAILED', message: 'ICE restart failed' });
      scheduleICERestart();
    } finally {
      isRestartingRef.current = false;
    }
  }, []);

  // Update local tracks when stream changes
  useEffect(() => {
    const pc = peerConnectionRef.current;
    const stream = localStreamRef.current;
    if (pc && stream) {
      // Remove old video tracks
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          pc.removeTrack(sender);
        }
      });
      // Add new video tracks
      stream.getVideoTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }
  }, [localStream]);

  useEffect(() => {
    const socket = socketRef.current;
    const currentRoomId = currentRoomIdRef.current;
    const localParticipantId = localParticipantIdRef.current;
    const localStream = localStreamRef.current;

    let cancelled = false;
    if (socket && currentRoomId && localParticipantId && localStream) {
      createPeerConnection()
        .then((pc) => {
          if (cancelled) {
            pc.close();
          }
        })
        .catch((err) => {
          console.error('[WebRTC] Failed to create peer connection:', err);
          setError({ code: 'PEER_CONNECTION_FAILED', message: 'Failed to set up camera connection' });
        });
    }

    return () => {
      cancelled = true;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [socket, currentRoomId, localParticipantId, localStream, createPeerConnection]);

  useEffect(() => {
    const ws = socket;
    const pc = peerConnectionRef.current;
    if (!ws || !pc) return;

    const handleOffer = async (data: { from: ParticipantId; offer: RTCSessionDescriptionInit }) => {
      if (data.from === localParticipantIdRef.current) return;
      const curPc = peerConnectionRef.current;
      if (!curPc) return;

      try {
        await curPc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await curPc.createAnswer();
        await curPc.setLocalDescription(answer);

        const currentRoomId = currentRoomIdRef.current;
        if (currentRoomId) {
          ws.emit('webrtc:answer', {
            roomId: currentRoomId,
            to: data.from,
            answer: curPc.localDescription!.toJSON(),
          } as WebRTCAnswerPayload);
        }

        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            await curPc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      } catch (err) {
        console.error('[WebRTC] Failed to handle offer:', err);
        setError({ code: 'ANSWER_CREATION_FAILED', message: 'Failed to create answer' });
      }
    };

    const handleAnswer = async (data: { from: ParticipantId; answer: RTCSessionDescriptionInit }) => {
      if (data.from === localParticipantIdRef.current) return;
      const curPc = peerConnectionRef.current;
      if (!curPc) return;

      try {
        await curPc.setRemoteDescription(new RTCSessionDescription(data.answer));

        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            await curPc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      } catch (err) {
        console.error('[WebRTC] Failed to handle answer:', err);
        setError({ code: 'ANSWER_CREATION_FAILED', message: 'Failed to process answer' });
      }
    };

    const handleIceCandidate = async (data: { from: ParticipantId; candidate: RTCIceCandidateInit }) => {
      if (data.from === localParticipantIdRef.current) return;
      const curPc = peerConnectionRef.current;
      if (!curPc) return;

      try {
        if (curPc.remoteDescription) {
          await curPc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          pendingCandidatesRef.current.push(data.candidate);
        }
      } catch (err) {
        console.error('[WebRTC] Failed to add ICE candidate:', err);
        setError({ code: 'ICE_CANDIDATE_ERROR', message: 'Failed to add ICE candidate' });
      }
    };

    ws.on('webrtc:offer', handleOffer);
    ws.on('webrtc:answer', handleAnswer);
    ws.on('webrtc:ice-candidate', handleIceCandidate);

    return () => {
      ws.off('webrtc:offer', handleOffer);
      ws.off('webrtc:answer', handleAnswer);
      ws.off('webrtc:ice-candidate', handleIceCandidate);
    };
  }, [socket]);

  const createOffer = useCallback(async () => {
    const pc = peerConnectionRef.current;
    const socket = socketRef.current;
    const currentRoomId = currentRoomIdRef.current;
    const localParticipantId = localParticipantIdRef.current;

    if (!pc || !socket || !currentRoomId) return;

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      const targetParticipant = localParticipantId === 'A' ? 'B' : 'A';
      socket.emit('webrtc:offer', {
        roomId: currentRoomId,
        to: targetParticipant,
        offer: pc.localDescription!.toJSON(),
      } as WebRTCOfferPayload);
    } catch (err) {
      console.error('[WebRTC] Failed to create offer:', err);
      setError({ code: 'OFFER_CREATION_FAILED', message: 'Failed to create offer' });
      throw err;
    }
  }, []);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    const socket = socketRef.current;
    const currentRoomId = currentRoomIdRef.current;
    const localParticipantId = localParticipantIdRef.current;

    if (!pc || !socket || !currentRoomId) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const targetParticipant = localParticipantId === 'A' ? 'B' : 'A';
      socket.emit('webrtc:answer', {
        roomId: currentRoomId,
        to: targetParticipant,
        answer: pc.localDescription!.toJSON(),
      } as WebRTCAnswerPayload);
    } catch (err) {
      console.error('[WebRTC] Failed to create answer:', err);
      setError({ code: 'ANSWER_CREATION_FAILED', message: 'Failed to create answer' });
      throw err;
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    } catch (err) {
      console.error('[WebRTC] Failed to add ICE candidate:', err);
      setError({ code: 'ICE_CANDIDATE_ERROR', message: 'Failed to add ICE candidate' });
      throw err;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setConnectionState('new');
    setIceConnectionState('new');
    setError(null);
    pendingCandidatesRef.current = [];
    reconnectAttemptsRef.current = 0;
    isRestartingRef.current = false;
  }, []);

  return {
    localStream: localStreamRef.current,
    remoteStream,
    connectionState,
    error,
    iceConnectionState,
    createOffer,
    createAnswer,
    addIceCandidate,
    cleanup,
    restartICE,
  };
}