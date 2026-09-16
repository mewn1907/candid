// ©️ Mewn

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CaptureState,
  CaptureStateInfo,
  CaptureError,
  CapturePreparePayload,
  CaptureCountdownPayload,
  CaptureExecutePayload,
  CaptureCompletePayload,
  CaptureResultPayload,
  ParticipantId,
  PhotoFilterId,
} from '../../../types/room.types';
import { Socket } from 'socket.io-client';
import { canvasFilterFor, normalizePhotoFilterId } from '../filters';
import { buildCollage, CollageLayout } from '../collage';

const VALID_TRANSITIONS: Record<CaptureState, CaptureState[]> = {
  idle: ['preparing'],
  // 'preparing' is reachable from result/composing because a server
  // capture:prepare is authoritative — it restarts the flow (burst mode).
  preparing: ['countdown'],
  countdown: ['capturing'],
  capturing: ['composing'],
  composing: ['result', 'preparing'],
  result: ['idle', 'preparing', 'gallery'],
  gallery: ['idle'],
};

export function useCapture(
  socket: Socket | null,
  currentRoomId: string | null,
  localParticipantId: ParticipantId | null,
  localStream: MediaStream | null
): CaptureStateInfo & {
  startCapture: () => Promise<void>;
  retake: () => void;
  clearError: () => void;
  filter: PhotoFilterId;
  setFilter: (filter: PhotoFilterId) => void;
  durationSec: number;
  setDurationSec: (seconds: number) => void;
  burstCount: number;
  setBurstCount: (count: number) => void;
  burstPlan: { index: number; total: number } | null;
  burstImages: string[];
  collageImage: string | null;
  collageLayout: CollageLayout;
  createCollage: (layout?: CollageLayout, seasonalId?: import('../seasonal').SeasonalFrameId) => Promise<void>;
  cleanupCapture: () => void;
} {
  const [state, setState] = useState<CaptureState>('idle');
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [remoteImage, setRemoteImage] = useState<string | null>(null);
  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [error, setError] = useState<CaptureError | null>(null);
  const [filter, setFilterState] = useState<PhotoFilterId>('natural');
  const [durationSec, setDurationSecState] = useState<number>(3);
  const [burstCount, setBurstCountState] = useState<number>(1);
  const [burstPlan, setBurstPlan] = useState<{ index: number; total: number } | null>(null);
  const [burstImages, setBurstImages] = useState<string[]>([]);
  const [collageImage, setCollageImage] = useState<string | null>(null);
  const [collageLayout, setCollageLayout] = useState<CollageLayout>('strip');

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateTransition = useCallback((from: CaptureState, to: CaptureState): boolean => {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }, []);

  const transitionTo = useCallback((newState: CaptureState) => {
    if (!validateTransition(state, newState)) {
      const err: CaptureError = {
        code: 'INVALID_STATE_TRANSITION',
        message: `Invalid state transition from ${state} to ${newState}`,
      };
      setError(err);
      console.error('[Capture] Invalid transition:', state, '->', newState);
      return false;
    }
    setState(newState);
    return true;
  }, [state, validateTransition]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const captureFromVideo = useCallback((video: HTMLVideoElement, filter: PhotoFilterId): string => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    // Older browsers lack CanvasRenderingContext2D.filter — draw unfiltered.
    if ('filter' in ctx) {
      ctx.filter = canvasFilterFor(filter);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  const composeImages = useCallback((
    localImg: string,
    remoteImg: string,
    localParticipantId: ParticipantId
  ): Promise<string> => {
    const localCanvas = document.createElement('canvas');
    const remoteCanvas = document.createElement('canvas');
    const outputCanvas = document.createElement('canvas');
    
    const localCtx = localCanvas.getContext('2d');
    const remoteCtx = remoteCanvas.getContext('2d');
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!localCtx || !remoteCtx || !outputCtx) {
      throw new Error('Failed to get canvas contexts');
    }

    const img1 = new Image();
    const img2 = new Image();
    
    return new Promise((resolve) => {
      let loaded = 0;
      const checkLoaded = async () => {
        loaded++;
        if (loaded === 2) {
          const width = Math.max(localCanvas.width, remoteCanvas.width);
          const height = Math.max(localCanvas.height, remoteCanvas.height);
          
          outputCanvas.width = width * 2;
          outputCanvas.height = height;
          
          if (localParticipantId === 'A') {
            outputCtx.drawImage(localCanvas, 0, 0, width, height);
            outputCtx.drawImage(remoteCanvas, width, 0, width, height);
          } else {
            outputCtx.drawImage(remoteCanvas, 0, 0, width, height);
            outputCtx.drawImage(localCanvas, width, 0, width, height);
          }
          
          outputCtx.fillStyle = '#292524';
          outputCtx.font = '300 24px sans-serif';
          outputCtx.textAlign = 'center';
          outputCtx.fillText('CANDID', width, 40);

          outputCtx.fillStyle = 'rgba(41,37,36,0.75)';
          outputCtx.fillRect(0, height - 50, outputCanvas.width, 50);
          outputCtx.fillStyle = '#fff';
          outputCtx.font = '16px sans-serif';
          outputCtx.fillText('©️ Mewn', width, height - 18);

          // Textured grain — makes Warm Kodachrome / Velvia claim real on export
          try {
            const { applyTexturedGrain } = await import('../grain');
            applyTexturedGrain(outputCtx, outputCanvas.width, outputCanvas.height, 0.055);
          } catch {}
          
          resolve(outputCanvas.toDataURL('image/jpeg', 0.9));
        }
      };
      
      img1.onload = () => {
        localCanvas.width = img1.width;
        localCanvas.height = img1.height;
        localCtx.drawImage(img1, 0, 0);
        checkLoaded();
      };
      img2.onload = () => {
        remoteCanvas.width = img2.width;
        remoteCanvas.height = img2.height;
        remoteCtx.drawImage(img2, 0, 0);
        checkLoaded();
      };
      
      img1.src = localImg;
      img2.src = remoteImg;
    });
  }, []);

  useEffect(() => {
    if (!socket || !currentRoomId) return;

    const handlePrepare = (data: CapturePreparePayload) => {
      console.log('[Capture] Prepare received:', data);
      setCaptureId(data.captureId);
      setTargetTime(data.targetTime);
      // The starter's filter wins so both sides render the same look.
      setFilterState(normalizePhotoFilterId(data.filter));
      const total = Number.isInteger(data.burstTotal) ? Math.min(5, Math.max(1, data.burstTotal)) : 1;
      const index = Number.isInteger(data.burstIndex) ? Math.min(total, Math.max(1, data.burstIndex)) : 1;
      setBurstPlan({ index, total });
      setError(null);
      setLocalImage(null);
      setRemoteImage(null);
      setComposedImage(null);
      transitionTo('preparing');
    };

    const handleCountdown = (data: CaptureCountdownPayload) => {
      console.log('[Capture] Countdown:', data.remaining);
      setCountdown(data.remaining);
      if (state === 'preparing') {
        transitionTo('countdown');
      }
    };

    const handleExecute = (data: CaptureExecutePayload) => {
      console.log('[Capture] Execute:', data.captureId);
      transitionTo('capturing');
    };

    const handleComplete = (data: CaptureCompletePayload) => {
      console.log('[Capture] Complete from peer:', data.captureId);
      if (data.captureId === captureId) {
        setRemoteImage(data.image);
      }
    };

    const handleResult = (data: CaptureResultPayload) => {
      console.log('[Capture] Result:', data.captureId);
      setComposedImage(data.composedImage);
      transitionTo('result');
    };

    socket.on('capture:prepare', handlePrepare);
    socket.on('capture:countdown', handleCountdown);
    socket.on('capture:execute', handleExecute);
    socket.on('capture:complete', handleComplete);
    socket.on('capture:result', handleResult);

    return () => {
      socket.off('capture:prepare', handlePrepare);
      socket.off('capture:countdown', handleCountdown);
      socket.off('capture:execute', handleExecute);
      socket.off('capture:complete', handleComplete);
      socket.off('capture:result', handleResult);
    };
  }, [socket, currentRoomId, state, captureId, transitionTo]);

  useEffect(() => {
    if (targetTime && state === 'preparing') {
      const now = Date.now();
      const remaining = Math.ceil((targetTime - now) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
      }
    }
  }, [targetTime, state]);

  useEffect(() => {
    if (state === 'countdown' && countdown !== null && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdown === 0 && state === 'countdown') {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [state, countdown]);

  const emitPrepare = useCallback((index: number, total: number) => {
    if (!socket || !currentRoomId || !localStream) {
      const err: CaptureError = { code: 'CAPTURE_FAILED', message: 'Missing socket, room, or local stream' };
      setError(err);
      return;
    }
    setError(null);
    socket.emit('capture:prepare', { roomId: currentRoomId, filter, durationSec, burstIndex: index, burstTotal: total });
  }, [socket, currentRoomId, localStream, filter, durationSec]);

  const startCapture = useCallback(async () => {
    if (state !== 'idle') {
      const err: CaptureError = { code: 'INVALID_STATE_TRANSITION', message: `Cannot start capture from state ${state}` };
      setError(err);
      return;
    }

    try {
      emitPrepare(1, burstCount);
    } catch (err) {
      const captureErr: CaptureError = { code: 'CAPTURE_FAILED', message: 'Failed to initiate capture' };
      setError(captureErr);
    }
  }, [state, burstCount, emitPrepare]);

  useEffect(() => {
    let mounted = true;

    async function captureLocalImage() {
      if (state === 'capturing' && localStream && mounted) {
        const video = document.createElement('video');
        video.srcObject = localStream;
        video.muted = true;
        video.playsInline = true;
        
        await video.play().catch(() => {});
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          const localImg = captureFromVideo(video, filter);
          if (mounted) {
            setLocalImage(localImg);
            
            if (socket && currentRoomId && captureId) {
              socket.emit('capture:complete', { captureId, image: localImg });
            }
            
            transitionTo('composing');
          }
        } catch (err) {
          console.error('[Capture] Failed to capture local image:', err);
          if (mounted) {
            setError({ code: 'CAPTURE_FAILED', message: 'Failed to capture image' });
          }
        }
      }
    }

    captureLocalImage();

    return () => {
      mounted = false;
    };
  }, [state, localStream, socket, currentRoomId, captureId, captureFromVideo, transitionTo, filter]);

  useEffect(() => {
    let mounted = true;

    async function composeAndEmit() {
      if (state === 'composing' && localImage && remoteImage && localParticipantId && mounted) {
        try {
          const composed = await composeImages(localImage, remoteImage, localParticipantId);
          if (mounted) {
            setComposedImage(composed);
            setBurstImages((prev) => [...prev, composed]);

            if (socket && currentRoomId && captureId) {
              socket.emit('capture:result', { captureId, composedImage: composed });
            }

            transitionTo('result');
          }
        } catch (err) {
          console.error('[Capture] Failed to compose images:', err);
          if (mounted) {
            setError({ code: 'COMPOSITION_FAILED', message: 'Failed to compose images' });
          }
        }
      }
    }

    composeAndEmit();

    return () => {
      mounted = false;
    };
  }, [state, localImage, remoteImage, localParticipantId, socket, currentRoomId, captureId, composeImages, transitionTo]);

  useEffect(() => {
    if (state === 'capturing') {
      captureTimeoutRef.current = setTimeout(() => {
        setError({ code: 'CAPTURE_TIMEOUT', message: 'Capture timed out' });
      }, 10000);
    }
    return () => {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, [state]);

  // Burst driver: stash happens in the compose effect above. On the final
  // shot both sides enter the gallery; otherwise only participant A fires
  // the next prepare (B follows via broadcast) to avoid double-prepares.
  // NOTE: plan/emits happen inside the timeout — updating state first would
  // re-render, run this cleanup, and cancel our own advance.
  useEffect(() => {
    if (state !== 'result' || !burstPlan) return;
    if (burstPlan.index >= burstPlan.total) {
      transitionTo('gallery');
      return;
    }
    if (localParticipantId !== 'A') return;
    const next = { index: burstPlan.index + 1, total: burstPlan.total };
    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setBurstPlan(next);
      emitPrepare(next.index, next.total);
    }, 1200);
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, [state, burstPlan, localParticipantId, emitPrepare, transitionTo]);

  const setFilter = useCallback((next: PhotoFilterId) => {
    if (state === 'idle') {
      const normalized = normalizePhotoFilterId(next as unknown as string);
      setFilterState(normalized);
    }
  }, [state]);

  const setDurationSec = useCallback((seconds: number) => {
    if (state === 'idle' && Number.isInteger(seconds) && seconds >= 3 && seconds <= 10) {
      setDurationSecState(seconds);
    }
  }, [state]);

  const setBurstCount = useCallback((count: number) => {
    if (state === 'idle' && (count === 1 || count === 3)) {
      setBurstCountState(count);
    }
  }, [state]);

  const retake = useCallback(() => {
    if (state === 'result' || state === 'gallery') {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      setLocalImage(null);
      setRemoteImage(null);
      setComposedImage(null);
      setCaptureId(null);
      setTargetTime(null);
      setCountdown(null);
      setError(null);
      setBurstImages([]);
      setBurstPlan(null);
      setCollageImage(null);
      transitionTo('idle');
    }
  }, [state, transitionTo]);

  const createCollage = useCallback(async (layout: CollageLayout = collageLayout, seasonalId: import('../seasonal').SeasonalFrameId = 'none') => {
    if (burstImages.length === 0) return;
    setCollageLayout(layout);
    try {
      const collage = await buildCollage(burstImages, layout, seasonalId);
      setCollageImage(collage);
    } catch (err) {
      console.error('[Capture] collage failed', err);
      setError({ code: 'COMPOSITION_FAILED', message: 'Failed to build collage' });
    }
  }, [burstImages, collageLayout]);

  const cleanupCapture = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  return {
    state,
    captureId,
    targetTime,
    countdown,
    localImage,
    remoteImage,
    composedImage,
    error,
    filter,
    durationSec,
    burstCount,
    burstPlan,
    burstImages,
    collageImage,
    collageLayout,
    startCapture,
    retake,
    clearError,
    setFilter,
    setDurationSec,
    setBurstCount,
    createCollage,
    cleanupCapture,
  };
}