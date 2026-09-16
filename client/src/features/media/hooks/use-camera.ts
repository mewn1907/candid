// ©️ Mewn

import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraState, CameraError, CameraErrorCode, CameraConstraints } from '../../../types/room.types';

const DEFAULT_CONSTRAINTS: CameraConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

interface UseCameraReturn extends CameraState {
  start: (constraints?: Partial<CameraConstraints>) => Promise<void>;
  stop: () => void;
  switchCamera: () => Promise<void>;
  clearError: () => void;
  attachVideo: (video: HTMLVideoElement | null) => void;
  checkPermission: () => Promise<PermissionState>;
  retryWithPermission: () => Promise<void>;
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const permissionStateRef = useRef<PermissionState>('prompt');

  const mapError = useCallback((err: Error): CameraError => {
    let code: CameraErrorCode = 'UNKNOWN_ERROR';
    let message = 'An unknown camera error occurred';

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      code = 'PERMISSION_DENIED';
      message = 'Camera permission was denied. Please allow camera access in your browser settings.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      code = 'CAMERA_UNAVAILABLE';
      message = 'No camera found. Please connect a camera and try again.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      code = 'CAMERA_IN_USE';
      message = 'Camera is already in use by another application.';
    } else if (err.name === 'OverconstrainedError') {
      code = 'CAMERA_UNAVAILABLE';
      message = 'Camera does not support the requested resolution.';
    } else if (err.name === 'NotSupportedError') {
      code = 'UNSUPPORTED_BROWSER';
      message = 'Camera API not supported in this browser.';
    } else if (err.name === 'AbortError') {
      code = 'STREAM_STOPPED';
      message = 'Camera stream was stopped.';
    } else {
      message = err.message || message;
    }

    return { code, message };
  }, []);

  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      permissionStateRef.current = permission.state;
      return permission.state;
    } catch {
      return 'prompt';
    }
  }, []);

  const retryWithPermission = useCallback(async () => {
    setError(null);
    const permission = await checkPermission();
    
    if (permission === 'denied') {
      const err = new Error('Permission denied');
      err.name = 'NotAllowedError';
      throw mapError(err);
    }
    
    await start();
  }, [checkPermission]);

  const start = useCallback(async (constraints?: Partial<CameraConstraints>) => {
    if (stream) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mergedConstraints: CameraConstraints = {
        ...DEFAULT_CONSTRAINTS,
        ...constraints,
        video: {
          ...DEFAULT_CONSTRAINTS.video,
          ...constraints?.video,
          facingMode: constraints?.video?.facingMode ?? facingMode,
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(mergedConstraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      const cameraError = mapError(err instanceof Error ? err : new Error(String(err)));
      setError(cameraError);
      throw cameraError;
    } finally {
      setLoading(false);
    }
  }, [stream, facingMode, mapError]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    if (stream) {
      await stop();
      await start({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    }
  }, [facingMode, stream, start, stop]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  }, [stream]);

  return {
    stream,
    error,
    loading,
    facingMode,
    start,
    stop,
    switchCamera,
    clearError,
    attachVideo,
    checkPermission,
    retryWithPermission,
  };
}