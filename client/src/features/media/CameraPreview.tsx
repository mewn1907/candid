// ©️ Mewn

import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from './hooks/use-camera';
import { PHOTO_FILTERS } from '../capture/filters';
import { PhotoFilterId } from '../../types/room.types';

interface CameraPreviewProps {
  onError?: (error: { code: string; message: string }) => void;
  onStreamReady?: (stream: MediaStream) => void;
  filterStyle?: string;
  filterId?: string;
  bgBlur?: boolean;
  allFilters?: typeof PHOTO_FILTERS;
  onFilterSwipe?: (next: PhotoFilterId) => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ onError, onStreamReady, filterStyle, filterId, bgBlur, allFilters, onFilterSwipe }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    stream,
    error,
    loading,
    facingMode,
    start,
    stop,
    switchCamera,
    clearError,
    attachVideo,
    retryWithPermission,
  } = useCamera();

  useEffect(() => {
    attachVideo(videoRef.current);
  }, [attachVideo]);

  useEffect(() => {
    if (stream && onStreamReady) {
      onStreamReady(stream);
    }
  }, [stream, onStreamReady]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleStart = async () => {
    clearError();
    try {
      await start();
    } catch {
      // Error handled by useCamera
    }
  };

  const handleRetry = async () => {
    clearError();
    try {
      await retryWithPermission();
    } catch {
      // Error handled by useCamera
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleSwitchCamera = async () => {
    clearError();
    try {
      await switchCamera();
    } catch {
      // Error handled by useCamera
    }
  };

  const getErrorMessage = (error: { code: string; message: string }) => {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        return 'Camera access was denied. Please click the camera icon in your browser address bar and allow camera access, then refresh the page.';
      case 'CAMERA_UNAVAILABLE':
        return 'No camera found. Please connect a camera and try again.';
      case 'CAMERA_IN_USE':
        return 'Camera is already in use by another application. Please close other apps using the camera.';
      case 'UNSUPPORTED_BROWSER':
        return 'Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.';
      case 'STREAM_STOPPED':
        return 'Camera stream was stopped unexpectedly.';
      case 'DEVICE_DISCONNECTED':
        return 'Camera was disconnected. Please reconnect and try again.';
      default:
        return error.message;
    }
  };

  const showPermissionDenied = error?.code === 'PERMISSION_DENIED';

  // Live preview polish: mirror, exposure hint (extra feature 1)
  const [mirrored, setMirrored] = useState(true);
  const [exposureHint, setExposureHint] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const mouseDownX = useRef<number | null>(null);

  useEffect(() => {
    setMirrored(facingMode === 'user');
  }, [facingMode]);

  useEffect(() => {
    if (!stream || !videoRef.current) {
      setExposureHint(null);
      return;
    }
    const video = videoRef.current;
    let raf = 0;
    let lastSample = 0;
    const sample = () => {
      const now = Date.now();
      if (now - lastSample > 1500 && video.videoWidth > 0 && video.videoHeight > 0) {
        lastSample = now;
        try {
          const c = document.createElement('canvas');
          const w = 32;
          const h = 18;
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
              // luma approx
              sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            }
            const avg = sum / (w * h);
            if (avg < 55) setExposureHint('Dim — try more light');
            else if (avg > 185) setExposureHint('Bright — soften light');
            else setExposureHint('Balanced light');
          }
        } catch {
          // ignore sampling errors
        }
      }
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, [stream]);

  useEffect(() => {
    if (stream && onFilterSwipe) {
      const t = setTimeout(() => setShowSwipeHint(false), 3200);
      return () => clearTimeout(t);
    }
  }, [stream, onFilterSwipe]);

  const handleSwipe = (diff: number) => {
    if (!onFilterSwipe || !allFilters || !filterId) return;
    if (Math.abs(diff) < 42) return;
    const idx = allFilters.findIndex((f) => f.id === filterId);
    if (idx === -1) return;
    const nextIdx = diff < 0 ? (idx + 1) % allFilters.length : (idx - 1 + allFilters.length) % allFilters.length;
    onFilterSwipe(allFilters[nextIdx].id as PhotoFilterId);
    setShowSwipeHint(false);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    handleSwipe(diff);
    touchStartX.current = null;
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    mouseDownX.current = e.clientX;
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (mouseDownX.current === null) return;
    const diff = e.clientX - mouseDownX.current;
    handleSwipe(diff);
    mouseDownX.current = null;
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        className="aspect-video bg-surface-950 rounded-xl overflow-hidden relative border border-surface-800/50 backdrop-blur-sm select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        style={{ touchAction: 'pan-y' } as any}
      >
        {stream ? (
          <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ 
                  transform: mirrored ? 'scaleX(-1)' : undefined,
                  filter: [filterStyle, bgBlur ? 'blur(6px)' : ''].filter(Boolean).join(' ') || undefined,
                  transition: 'filter 220ms ease',
                }}
                autoPlay
                playsInline
                muted
              />
            {/* Swipe filter — insta/snap on preview */}
            {stream && onFilterSwipe && allFilters && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15">
                  <span className={`w-1.5 h-1.5 rounded-full ${filterId === 'natural' ? 'bg-white' : 'bg-white/60'}`} />
                  <span className="text-white text-[11px] font-medium tracking-wide">{allFilters.find((f) => f.id === filterId)?.label ?? filterId}</span>
                  <span className="text-white/60 text-[10px]">•</span>
                  <span className="text-white/70 text-[10px] font-mono">{allFilters.findIndex((f) => f.id === filterId) + 1}/{allFilters.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  {allFilters.slice(0, 8).map((f) => (
                    <span key={f.id} className={`h-1 rounded-full transition-all ${f.id === filterId ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
                  ))}
                  {allFilters.length > 8 && <span className="text-white/50 text-[9px]">+{allFilters.length - 8}</span>}
                </div>
                {showSwipeHint && (
                  <span className="text-white/70 text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">Swipe ← → to change</span>
                )}
              </div>
            )}
            {exposureHint && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-caption font-medium bg-white/90 text-surface-700 backdrop-blur-sm border border-white/50">
                {exposureHint}
              </div>
            )}
            {filterId && filterId !== 'natural' && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-clay/85 text-cream text-[10px] font-mono uppercase tracking-wider backdrop-blur-sm border border-white/20 shadow-sm">
                {filterId}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-end p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMirrored((v) => !v)}
                  className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${mirrored ? 'bg-white text-surface-900' : 'bg-white/10 text-white/90 hover:text-white hover:bg-white/20'}`}
                  aria-pressed={mirrored}
                  aria-label="Toggle mirror"
                  title="Mirror"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" />
                  </svg>
                </button>
                <button
                  onClick={handleSwitchCamera}
                  disabled={loading}
                  className="p-2 text-white/90 hover:text-white transition-colors bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                  title="Switch camera"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 2l4 4-4 4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11v-1a4 4 0 014-4h14" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 22l-4-4 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13v1a4 4 0 01-4 4H3" />
                  </svg>
                </button>
                <button
                  onClick={handleStop}
                  className="px-4 py-2 text-white font-medium rounded-lg bg-stone-600/90 hover:bg-stone-600 transition-colors backdrop-blur-sm"
                  aria-label="Stop camera"
                >
                  Stop
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center text-white gap-3 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center animate-pulse-soft shrink-0">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-heading-sm sm:text-heading-md font-medium">Camera Preview</h3>
              <p className="text-white/65 max-w-[260px] text-xs sm:text-sm leading-relaxed">
                Tap Start to enable your camera — you’ll see yourself here
              </p>
            </div>
            <button
              onClick={handleStart}
              disabled={loading}
              className="btn-primary btn-md sm:btn-lg w-auto min-w-[160px] sm:min-w-[180px] mt-1 animate-in"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Starting...</span>
                </>
              ) : (
                'Start Camera'
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 animate-in" role="alert">
          <div className="flex items-start gap-3 p-4 bg-stone-100 border border-surface-300 rounded-xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-stone-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-700">Camera Error</p>
              <p className="text-sm text-stone-600 mt-1">{getErrorMessage(error)}</p>

              {showPermissionDenied && (
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-white/50 rounded-lg border border-surface-200">
                    <p className="text-xs font-medium text-stone-700 mb-2">How to fix:</p>
                    <ol className="text-xs text-stone-600 space-y-1 list-decimal list-inside">
                      <li>Click the camera icon &ldquo;📷&rdquo; or &ldquo;🔒&rdquo; in your browser address bar</li>
                      <li>Select &ldquo;Allow&rdquo; for camera access</li>
                      <li>Click &ldquo;Retry with Permission&rdquo; below</li>
                    </ol>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="btn-primary btn-sm w-full"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry with Permission
                  </button>
                </div>
              )}

              {!showPermissionDenied && (
                <button
                  onClick={handleStart}
                  className="mt-2 text-sm font-medium text-stone-600 hover:text-stone-600 underline"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};