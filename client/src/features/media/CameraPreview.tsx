// ©️ Mewn

import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from './hooks/use-camera';

interface CameraPreviewProps {
  onError?: (error: { code: string; message: string }) => void;
  onStreamReady?: (stream: MediaStream) => void;
  filterStyle?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ onError, onStreamReady, filterStyle }) => {
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

  // Live preview polish: grid, mirror, exposure hint (extra feature 1)
  const [showGrid, setShowGrid] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [exposureHint, setExposureHint] = useState<string | null>(null);

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

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="aspect-video bg-surface-950 rounded-xl overflow-hidden relative border border-surface-800/50 backdrop-blur-sm">
        {stream ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={{ 
                transform: mirrored ? 'scaleX(-1)' : undefined,
                filter: filterStyle || undefined,
              }}
              autoPlay
              playsInline
              muted
            />
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div />
                  <div className="border-r border-t border-white/20" />
                  <div className="border-r border-t border-white/20" />
                  <div className="border-t border-white/20" />
                  <div className="border-r border-t border-white/20" />
                  <div className="border-r border-t border-white/20" />
                  <div className="border-t border-white/20" />
                </div>
              </div>
            )}
            {exposureHint && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-caption font-medium bg-white/90 text-surface-700 backdrop-blur-sm border border-white/50">
                {exposureHint}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-white text-sm font-medium px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                  <span className="w-2 h-2 rounded-full bg-pine-600" aria-hidden="true" />
                  {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrid((v) => !v)}
                  className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${showGrid ? 'bg-white text-surface-900' : 'bg-white/10 text-white/90 hover:text-white hover:bg-white/20'}`}
                  aria-pressed={showGrid}
                  aria-label="Toggle grid overlay"
                  title="Grid"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                  </svg>
                </button>
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
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6 animate-pulse-soft">
              <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-heading-md font-medium mb-2">Camera Preview</h3>
            <p className="text-white/60 mb-8 max-w-xs text-body-md">
              Click &ldquo;Start Camera&rdquo; to begin preview. Your camera feed will appear here.
            </p>
            <button
              onClick={handleStart}
              disabled={loading}
              className="btn-primary btn-lg w-full max-w-xs animate-in"
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