// ©️ Mewn

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomContext } from './hooks/use-room-context';
import { InvitePanel } from './components/InvitePanel';
import { CameraPreview } from '../media/CameraPreview';
import { useWebRTC, RemoteVideo } from '../webrtc';
import { useCapture, FilterSelector } from '../capture';
import { PhotoEditor } from '../capture/PhotoEditor';
import { buildPolaroid } from '../capture/polaroid';
import { playTick, playShutter } from '../capture/sounds';
import { copyImageToClipboard, shareImage } from '../capture/share';
import { canvasFilterFor, PHOTO_FILTERS } from '../capture/filters';
import { SeasonalSelector } from '../capture/SeasonalSelector';
import { SeasonalFrameId } from '../capture/seasonal';
import { PromptCard, DoodleOverlay, StickerOverlay } from '../capture/CreativeExtras';
import { ThemeSwitcher } from '../theme';

export const RoomView: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    currentRoom,
    currentParticipantId,
    joinRoom,
    loading,
    error,
    leaveRoom,
    socket,
    apiUrl,
  } = useRoomContext() as any;
  const [cameraError, setCameraError] = useState<{ code: string; message: string } | null>(null);
  const [webrtcError, setWebRTCError] = useState<{ code: string; message: string } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  const isConnected = currentRoom?.status === 'connected' && (currentRoom?.participants.length ?? 0) === 2;
  const isWaiting = currentRoom?.status === 'waiting' || (currentRoom?.participants.length ?? 0) < 2;
  const otherParticipantLabel = currentParticipantId === 'A' ? 'Participant B' : 'Participant A';

  const { remoteStream, connectionState, error: webrtcHookError, createOffer, cleanup } = useWebRTC(
    socket,
    currentRoom?.id || null,
    currentParticipantId,
    localStream
  );

  const {
    state: captureState,
    countdown,
    composedImage,
    error: captureError,
    filter,
    setFilter,
    durationSec,
    setDurationSec,
    burstCount,
    setBurstCount,
    burstPlan,
    burstImages,
    collageImage,
    createCollage,
    startCapture,
    retake,
    cleanupCapture,
  } = useCapture(
    socket,
    currentRoom?.id || null,
    currentParticipantId,
    localStream
  );

  useEffect(() => {
    if (!roomId) return;
    if (currentRoom?.id === roomId && currentParticipantId && currentRoom.participants.some((p: any) => p.id === currentParticipantId)) return;
    joinRoom(roomId).catch(() => {
      navigate('/', { replace: true });
    });
  }, [roomId, currentRoom?.id, currentRoom?.participants, currentParticipantId, joinRoom, navigate]);

  useEffect(() => {
    if (webrtcHookError) {
      setWebRTCError({ code: webrtcHookError.code, message: webrtcHookError.message });
    }
  }, [webrtcHookError]);

  useEffect(() => {
    if (!socket) return;

    const onDisconnect = (reason: string) => {
      console.log('[RoomView] Socket disconnected:', reason);
      setNetworkStatus('disconnected');
    };

    const onReconnect = (attemptNumber: number) => {
      console.log('[RoomView] Socket reconnecting:', attemptNumber);
      setNetworkStatus('reconnecting');
    };

    const onReconnectAttempt = (attemptNumber: number) => {
      console.log('[RoomView] Socket reconnect attempt:', attemptNumber);
    };

    const onReconnectFailed = () => {
      console.log('[RoomView] Socket reconnect failed');
      setNetworkStatus('disconnected');
    };

    const onConnect = () => {
      console.log('[RoomView] Socket connected');
      setNetworkStatus('connected');
    };

    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect_failed', onReconnectFailed);
    socket.on('connect', onConnect);

    setNetworkStatus(socket.connected ? 'connected' : 'disconnected');

    return () => {
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect_failed', onReconnectFailed);
      socket.off('connect', onConnect);
    };
  }, [socket]);

  useEffect(() => {
    if (isConnected && localStream && currentParticipantId === 'A') {
      createOffer().catch((err: unknown) => {
        console.error('[RoomView] Failed to create offer:', err);
      });
    }
  }, [isConnected, localStream, currentParticipantId, createOffer]);

  useEffect(() => {
    return () => {
      cleanup();
      cleanupCapture();
    };
  }, [cleanup, cleanupCapture]);

  const handleStreamReady = (stream: MediaStream) => {
    setLocalStream(stream);
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/', { replace: true });
  };

  const [galleryIndex, setGalleryIndex] = useState(0);
  const selectedGalleryIndex =
    burstImages.length === 0 ? 0 : Math.min(galleryIndex, burstImages.length - 1);

  const [collageChoice, setCollageChoice] = useState<'strip' | 'grid'>('strip');

  // Quick-edit (extra feature 2) — local overrides keep originals
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<'single' | 'burst' | 'collage' | null>(null);
  const [editedSingle, setEditedSingle] = useState<string | null>(null);
  const [editedBurst, setEditedBurst] = useState<Record<number, string>>({});
  const [editedCollage, setEditedCollage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Extra: shutter sounds + haptic (optional)
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (captureState === 'capturing') {
      if (soundEnabled) playShutter();
      if (hapticEnabled && 'vibrate' in navigator) (navigator as any).vibrate?.([30, 40, 80]);
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 320);
      return () => {
        clearTimeout(t);
        setFlash(false);
      };
    }
    // Ensure flash is off when leaving capturing (e.g., composing/result)
    setFlash(false);
  }, [captureState, soundEnabled, hapticEnabled]);

  const handleRetakeAll = () => {
    setGalleryIndex(0);
    setEditedSingle(null);
    setEditedBurst({});
    setEditedCollage(null);
    setPolaroidSingle(null);
    setPolaroidBurst(null);
    retake();
  };

  const displaySingle = editedSingle ?? composedImage;
  const displayBurstSrc = editedBurst[selectedGalleryIndex] ?? burstImages[selectedGalleryIndex];
  const displayCollage = editedCollage ?? collageImage;

  // Extra feature 3: polaroid export (local, wabi-sabi)
  const [polaroidSingle, setPolaroidSingle] = useState<string | null>(null);
  const [polaroidBurst, setPolaroidBurst] = useState<string | null>(null);
  const [polaroidCaption, setPolaroidCaption] = useState('Candid · wabi-sabi');
  const [seasonalFrame, setSeasonalFrame] = useState<SeasonalFrameId>('none');
  // Creative extras (all optional, off by default)
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptEnabled, setPromptEnabled] = useState(false);
  const [bgBlur, setBgBlur] = useState(false);
  const [doubleExposure, setDoubleExposure] = useState(false);
  const [washiColor, setWashiColor] = useState('#E5BF94');
  const [boomerang, setBoomerang] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [doodleTarget, setDoodleTarget] = useState<string | null>(null);
  const [stickerTarget, setStickerTarget] = useState<string | null>(null);

  const doStartCapture = () => {
    if (boomerang && localStream) {
      try {
        const rec = new MediaRecorder(localStream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];
        rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        rec.onstop = () => { const blob = new Blob(chunks, { type: 'video/webm' }); setClipUrl(URL.createObjectURL(blob)); };
        rec.start(); setTimeout(()=>{ if (rec.state==='recording') rec.stop(); }, 3000);
      } catch {}
    }
    startCapture();
  };
  const handleStartCapture = () => {
    if (promptEnabled && !showPrompt) { setShowPrompt(true); return; }
    setShowPrompt(false);
    doStartCapture();
  };

  // Extra feature 5: share polish
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [roomIdCopied, setRoomIdCopied] = useState(false);
  const flashNote = (msg: string) => {
    setShareNote(msg);
    setTimeout(() => setShareNote(null), 2200);
  };

  // Keyboard shortcuts: Space/Enter → Capture, R → Retake, D → Download, Esc → Leave/Close
  // Respects focus in inputs/textareas and open overlays; no capture during countdown/capturing.
  useEffect(() => {
    const isTypingTarget = (el: Element | null) => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return (el as HTMLElement).isContentEditable;
    };

    const triggerDownload = (url: string, filename: string) => {
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        flashNote('Download started ✓ (D)');
      } catch {
        flashNote('Download failed — try the button');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isTyping = isTypingTarget(active);
      const hasOverlay = !!(editingSrc || doodleTarget || stickerTarget);

      if (e.key === 'Escape') {
        if (hasOverlay) {
          setEditingSrc(null);
          setEditingTarget(null);
          setDoodleTarget(null);
          setStickerTarget(null);
          if (showPrompt) setShowPrompt(false);
          e.preventDefault();
          return;
        }
        if (showPrompt) {
          setShowPrompt(false);
          e.preventDefault();
          return;
        }
        if (isTyping) return;
        if (captureState === 'idle' || captureState === 'result' || captureState === 'gallery') {
          handleLeave();
          e.preventDefault();
        }
        return;
      }

      if (isTyping || hasOverlay) return;
      if (!isConnected) return;

      const key = e.key.toLowerCase();

      if ((e.code === 'Space' || e.key === ' ' || e.key === 'Enter') && captureState === 'idle') {
        if (!localStream) return;
        if (active && active.tagName === 'BUTTON') return;
        e.preventDefault();
        handleStartCapture();
        return;
      }

      if (key === 'r' && (captureState === 'result' || captureState === 'gallery')) {
        e.preventDefault();
        handleRetakeAll();
        return;
      }

      if (key === 'd' && (captureState === 'result' || captureState === 'gallery')) {
        e.preventDefault();
        if (captureState === 'result' && displaySingle) {
          triggerDownload(displaySingle, 'candid-photo.jpg');
        } else if (captureState === 'gallery' && displayBurstSrc) {
          triggerDownload(displayBurstSrc, `candid-burst-${selectedGalleryIndex + 1}.jpg`);
        } else if (displayCollage) {
          triggerDownload(displayCollage, `candid-collage-${collageChoice}.jpg`);
        }
        return;
      }

      if (key === '?' || (key === 'h' && e.shiftKey)) {
        flashNote('Shortcuts: Space/Enter=Capture · R=Retake · D=Download · Esc=Leave/Close');
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // handleLeave/handleRetakeAll/handleStartCapture are stable for this room session; include isConnected/captureState etc to rebind when state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, captureState, localStream, editingSrc, doodleTarget, stickerTarget, showPrompt, displaySingle, displayBurstSrc, displayCollage, selectedGalleryIndex, collageChoice, burstImages.length]);

  const copyText = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('clipboard unavailable');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const getCaptureStateLabel = (state: string) => {
    switch (state) {
      case 'idle':
        return 'Ready';
      case 'preparing':
        return 'Preparing...';
      case 'countdown':
        return `Capture in ${countdown}...`;
      case 'capturing':
        return 'Capturing...';
      case 'composing':
        return 'Composing...';
      case 'result':
        return 'Complete!';
      case 'gallery':
        return 'Pick your favorite';
      default:
        return state;
    }
  };

  // Debug overlay — ?debug=1 or localStorage candid_debug=1
  const isDebug = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('debug') || localStorage.getItem('candid_debug') === '1');
  const debugInfo = {
    roomId,
    currentRoom,
    currentParticipantId,
    isConnected,
    isWaiting,
    networkStatus,
    apiUrl,
    socketId: socket?.id || 'none',
    socketConnected: socket?.connected ?? false,
    captureState,
    error: error || cameraError?.message || webrtcError?.message || captureError?.message || null,
  };

  // Extract countdown display value to satisfy TypeScript type narrowing in JSX
  const countdownDisplay = countdown !== null && countdown > 0 ? countdown : null;
  const waitingRoomId = isWaiting ? (currentRoom?.id ?? roomId ?? null) : null;
  const displayRoomId = currentRoom?.id ?? roomId ?? '—';
  const burstProgress =
    burstPlan && burstPlan.total > 1
      ? `Shot ${Math.min(burstPlan.index, burstPlan.total)} of ${burstPlan.total}`
      : null;

  const prevCountdownRef = useRef<number | null>(null);
  useEffect(() => {
    if (captureState === 'countdown' && countdownDisplay !== null && countdownDisplay !== prevCountdownRef.current) {
      prevCountdownRef.current = countdownDisplay;
      if (countdownDisplay > 0) {
        if (soundEnabled) playTick();
        if (hapticEnabled && 'vibrate' in navigator) (navigator as any).vibrate?.(18);
      }
    }
    if (captureState !== 'countdown') prevCountdownRef.current = null;
  }, [captureState, countdownDisplay, soundEnabled, hapticEnabled]);

  if (!roomId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-100 bg-paper-grain flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-in">
          <div className="w-12 h-12 rounded-full border-4 border-clay border-t-transparent animate-spin" />
          <p className="text-body-md text-ink-700">Connecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper-100 bg-paper-grain flex items-center justify-center px-4 animate-in">
        <div className="card-deckle max-w-md w-full p-8 text-center relative overflow-hidden">
          <div className="washi-tape" />
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-heading-md font-semibold text-surface-900 mb-2">Connection Error</h2>
          <p className="text-body-md text-surface-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="btn-primary btn-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-paper-100 bg-paper-grain flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-in">
          <div className="w-12 h-12 rounded-full border-4 border-clay border-t-transparent animate-spin" />
          <p className="text-body-md text-ink-700">Loading room...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-paper-100 bg-paper-grain flex flex-col py-8 px-4 sm:px-6 lg:px-8">
      {flash && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none" style={{ animation: 'fadeIn 60ms ease-out' }} aria-hidden="true" />
      )}
      <header className="max-w-4xl w-full mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center flex-1 w-full sm:w-auto">
            <h1 className="text-display-sm font-light text-surface-900 tracking-tight break-all">Room: <span className="text-wabi-700">{displayRoomId}</span></h1>
            <p className="mt-1 text-body-md text-surface-600">
              Your participant ID: <span className="font-mono font-semibold text-wabi-700">{currentParticipantId ?? '…'}</span>
            </p>
            <div className="flex sm:hidden justify-center mt-3">
              <ThemeSwitcher compact />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <div className="hidden sm:flex">
              <ThemeSwitcher compact />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-caption font-medium bg-surface-100 text-surface-700">
              <span className={`w-2 h-2 rounded-full ${
                networkStatus === 'connected' ? 'bg-pine-600' :
                networkStatus === 'reconnecting' ? 'bg-clay-800 animate-pulse-soft' :
                'bg-stone-600'
              }`} aria-hidden="true" />
              <span className="capitalize">{networkStatus}</span>
            </div>
            <button
              onClick={handleLeave}
              className="btn-ghost btn-sm"
              title="Shortcut: Esc"
              aria-keyshortcuts="Escape"
            >
              Leave Room <kbd className="hidden sm:inline-flex ml-1 items-center px-1 py-0.5 rounded border border-surface-300 bg-white text-[10px] font-mono">Esc</kbd>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full flex-1">
        <div className="card animate-in">
          {isWaiting && (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-wabi-100 flex items-center justify-center mx-auto mb-6 animate-pulse-soft">
                <svg className="w-10 h-10 text-wabi-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-heading-lg font-semibold text-surface-900 mb-2">Waiting for participant...</h2>
              <p className="text-body-lg text-surface-600 mb-8 max-w-md mx-auto">Share this room ID with the other person to start your Candid session.</p>

              <div className="bg-surface-100 rounded-xl p-6 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-body-sm font-medium text-surface-700">Room ID</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const ok = await copyText(displayRoomId);
                        if (ok) {
                          setRoomIdCopied(true);
                          setTimeout(() => setRoomIdCopied(false), 2000);
                        } else {
                          flashNote('Copy failed — select and copy manually');
                        }
                      }}
                      className="btn-ghost btn-sm text-wabi-700 hover:text-wabi-800"
                      aria-live="polite"
                    >
                      {roomIdCopied ? 'Copied!' : 'Copy'}
                    </button>
                    {typeof navigator.share === 'function' && (
                      <button
                        onClick={async () => {
                          const link = `${window.location.origin}/join/${displayRoomId}`;
                          try {
                            await (navigator as unknown as { share: (d: ShareData) => Promise<void> }).share({
                              title: 'Join my Candid room',
                              text: `Join room ${displayRoomId}`,
                              url: link,
                            });
                          } catch {
                            // user cancelled — ignore
                          }
                        }}
                        className="btn-ghost btn-sm text-wabi-700 hover:text-wabi-800"
                      >
                        Share
                      </button>
                    )}
                  </div>
                </div>
                <code className="text-heading-md font-mono tracking-widest text-surface-900 bg-white px-4 py-3 rounded-lg border border-surface-200 block w-full text-center select-all">
                  {displayRoomId}
                </code>
                {shareNote && <p className="text-caption text-center text-surface-500 mt-3" aria-live="polite">{shareNote}</p>}
              </div>

              <InvitePanel roomId={waitingRoomId} />

              <div className="mt-8 flex items-center justify-center gap-6 text-body-sm text-surface-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-wabi-500" aria-hidden="true" />
                  <span>Participant A</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-surface-300" aria-hidden="true" />
                  <span>Participant B</span>
                </span>
              </div>
            </div>
          )}

          {isConnected && (
            <div className="p-6 sm:p-8 space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pine-100 mb-2 mx-auto animate-bounce-soft">
                  <svg className="w-8 h-8 text-pine-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-heading-lg font-semibold text-surface-900">Both participants connected!</h2>
                <div className="flex items-center justify-center gap-4 text-body-sm text-surface-600">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pine-100 text-pine-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-pine-600 animate-pulse-soft" aria-hidden="true" />
                    WebRTC Connected
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-wabi-100 text-wabi-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-wabi-500" aria-hidden="true" />
                    Camera Ready
                  </span>
                </div>

                {showPrompt && <PromptCard onDismiss={() => { setShowPrompt(false); doStartCapture(); }} />}

                {captureState !== 'idle' && captureState !== 'gallery' && (
                  <div className="mt-4 p-4 bg-wabi-50 border border-wabi-200 rounded-xl animate-in">
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-medium text-wabi-800">{getCaptureStateLabel(captureState)}</p>
                      {burstProgress && (
                        <p className="text-body-sm text-surface-600">{burstProgress}</p>
                      )}
                      {countdownDisplay !== null ? (
                        <p className="text-display-md font-light text-wabi-700 tabular-nums">{countdownDisplay}</p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CameraPreview
                  onError={setCameraError}
                  onStreamReady={handleStreamReady}
                  filterStyle={canvasFilterFor(filter)}
                  filterId={filter}
                  bgBlur={bgBlur}
                  allFilters={PHOTO_FILTERS}
                  onFilterSwipe={setFilter}
                />

                <RemoteVideo
                  stream={remoteStream}
                  participantLabel={otherParticipantLabel}
                  connectionState={connectionState}
                  filterStyle={canvasFilterFor(filter)}
                  filterId={filter}
                />
              </div>
              {captureState === 'idle' && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleStartCapture}
                    disabled={!localStream}
                    className="btn-primary btn-md sm:btn-lg w-auto min-w-[200px] justify-center"
                    aria-disabled={!localStream}
                    aria-keyshortcuts="Space Enter"
                    title="Start Capture"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Start Capture</span>
                  </button>
                </div>
              )}
              {bgBlur && <p className="text-[11px] text-ink-500 text-center">Cozy blur bg enabled (extra)</p>}
              {clipUrl && (
                <div className="max-w-md mx-auto p-3 bg-paper-50 border border-paper-border rounded-organic text-center">
                  <p className="text-xs font-mono text-ink-700 mb-2">Boomerang clip (3s, extra)</p>
                  <video src={clipUrl} autoPlay loop muted playsInline className="w-full rounded-organic-sm" />
                  <a href={clipUrl} download={`candid-clip-${Date.now()}.webm`} className="btn-ghost btn-sm mt-2">Download clip</a>
                </div>
              )}
              {filter !== 'natural' && (filter as string) !== 'none' ? (
                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-clay-subtle border border-clay/20 w-fit mx-auto animate-in" aria-live="polite">
                  <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: PHOTO_FILTERS.find(f=>f.id===filter)?.swatch as any || '#c7b48f' }} />
                  <span className="text-caption font-medium text-clay-dark">Live preview: {PHOTO_FILTERS.find(f=>f.id===filter)?.label ?? filter} — {PHOTO_FILTERS.find(f=>f.id===filter)?.hint ?? 'filtered'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-paper-50 border border-paper-border w-fit mx-auto">
                  <span className="w-3 h-3 rounded-full border border-dashed border-ink-300 bg-white flex items-center justify-center text-[7px]">∅</span>
                  <span className="text-caption text-ink-600">Live preview: None — original, no filter (default)</span>
                </div>
              )}

              {captureState === 'result' && composedImage && (
                <div className="space-y-6 animate-in">
                  <h3 className="text-heading-md font-semibold text-surface-900 text-center">Your Candid Photo</h3>
                  <div className="relative w-full max-w-lg mx-auto aspect-square bg-surface-900 rounded-xl overflow-hidden shadow-lg border border-surface-700/30">
                    <img
                      src={displaySingle!}
                      alt="Your Candid photo - two participants side by side with Candid branding"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        setPolaroidSingle(null);
                        retake();
                      }}
                      className="btn-secondary btn-lg flex-1"
                      title="Shortcut: R"
                      aria-keyshortcuts="r"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retake <kbd className="ml-1 hidden sm:inline-flex items-center px-1 py-0.5 rounded border border-surface-300 bg-white text-[10px] font-mono">R</kbd>
                    </button>
                    <button
                      onClick={() => {
                        setEditingSrc(displaySingle!);
                        setEditingTarget('single');
                      }}
                      className="btn-ghost btn-lg flex-1 border border-surface-200"
                    >
                      ✎ Edit
                    </button>
                    <a
                      href={displaySingle!}
                      download="candid-photo.jpg"
                      className="btn-success btn-lg flex-1 flex items-center justify-center gap-2"
                      title="Shortcut: D"
                      aria-keyshortcuts="d"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download <kbd className="ml-1 hidden sm:inline-flex items-center px-1 py-0.5 rounded border border-white/30 bg-white/20 text-[10px] font-mono">D</kbd>
                    </a>
                  </div>
                  <p className="text-[11px] text-ink-500 text-center">Shortcuts: <kbd className="px-1 py-0.5 rounded border border-paper-border bg-white text-[10px] font-mono">R</kbd> retake · <kbd className="px-1 py-0.5 rounded border border-paper-border bg-white text-[10px] font-mono">D</kbd> download · <kbd className="px-1 py-0.5 rounded border border-paper-border bg-white text-[10px] font-mono">Esc</kbd> leave</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={async () => {
                        const r = await shareImage(displaySingle!, 'candid-photo.jpg', 'Candid');
                        flashNote(r === 'shared' ? 'Shared ✓' : r === 'copied' ? 'Copied to clipboard ✓' : 'Download instead');
                      }}
                      className="btn-ghost btn-sm border border-surface-200"
                    >
                      Share
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await copyImageToClipboard(displaySingle!);
                        flashNote(ok ? 'Copied image ✓' : 'Copy failed — try Download');
                      }}
                      className="btn-ghost btn-sm border border-surface-200"
                    >
                      Copy image
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center pt-3 border-t border-paper-border/50">
                    <button onClick={()=>setDoodleTarget(displaySingle!)} className="btn-ghost btn-sm border border-paper-border text-xs">✏️ Doodle (extra)</button>
                    <button onClick={()=>setStickerTarget(displaySingle!)} className="btn-ghost btn-sm border border-paper-border text-xs">⭐ Stickers (extra)</button>
                    <button onClick={async ()=>{
                      // double-exposure blend: overlay displaySingle with 50% opacity mirrored
                      const img = new Image(); img.src = displaySingle!; await new Promise(r=>img.onload=r);
                      const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const ctx=c.getContext('2d')!; ctx.drawImage(img,0,0); ctx.globalAlpha=0.45; ctx.save(); ctx.scale(-1,1); ctx.drawImage(img, -c.width,0,c.width,c.height); ctx.restore(); const url=c.toDataURL('image/jpeg',0.92); setEditedSingle(url); flashNote('Double exposure applied (extra)');
                    }} className="btn-ghost btn-sm border border-paper-border text-xs">Double exposure (extra)</button>
                    <span className="flex items-center gap-1 text-xs text-ink-500">Washi<span style={{background:washiColor} as any} className="w-4 h-4 rounded-full border border-paper-border inline-block" /></span>
                  </div>
                  {shareNote && <p className="text-caption text-center text-surface-500">{shareNote}</p>}
                  <div className="pt-4 border-t border-surface-200 space-y-3">
                    <p className="text-body-sm font-medium text-surface-700 text-center">Polaroid — wabi strip {seasonalFrame!=='none' ? `· ${seasonalFrame}`:''} <span className="text-xs text-ink-500">(extra: {washiColor})</span></p>
                    <input
                      value={polaroidCaption}
                      onChange={(e) => setPolaroidCaption(e.target.value)}
                      placeholder="Caption"
                      maxLength={24}
                      className="input text-center"
                    />
                    <button
                      onClick={async () => {
                        const p = await buildPolaroid(displaySingle!, polaroidCaption || 'Candid · wabi-sabi', seasonalFrame);
                        setPolaroidSingle(p);
                      }}
                      className="btn-secondary btn-md w-full"
                    >
                      Make Polaroid {seasonalFrame !== 'none' ? `· ${seasonalFrame}` : ''}
                    </button>
                    {polaroidSingle && (
                      <div className="space-y-3 animate-in">
                        <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow border border-surface-200 bg-white">
                          <img src={polaroidSingle} alt="Polaroid preview" className="w-full h-auto" />
                        </div>
                        <a href={polaroidSingle} download="candid-polaroid.jpg" className="btn-success btn-md w-full flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Polaroid
                        </a>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={async () => {
                              const r = await shareImage(polaroidSingle!, 'candid-polaroid.jpg', 'Candid polaroid');
                              flashNote(r === 'shared' ? 'Shared ✓' : r === 'copied' ? 'Copied ✓' : 'Download instead');
                            }}
                            className="btn-ghost btn-sm border border-surface-200"
                          >
                            Share polaroid
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await copyImageToClipboard(polaroidSingle!);
                              flashNote(ok ? 'Copied ✓' : 'Copy failed');
                            }}
                            className="btn-ghost btn-sm border border-surface-200"
                          >
                            Copy image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {captureState === 'gallery' && burstImages.length > 0 && (
                <div className="space-y-6 animate-in">
                  <h3 className="text-heading-md font-semibold text-surface-900 text-center">Pick your favorite</h3>
                  <div className="relative w-full max-w-lg mx-auto aspect-square bg-surface-900 rounded-xl overflow-hidden shadow-lg border border-surface-700/30">
                    <img
                      src={displayBurstSrc}
                      alt={`Burst shot ${selectedGalleryIndex + 1} of ${burstImages.length}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto" role="radiogroup" aria-label="Burst shots">
                    {burstImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={i === selectedGalleryIndex}
                        aria-label={`Shot ${i + 1}`}
                        onClick={() => setGalleryIndex(i)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-fast ${
                          i === selectedGalleryIndex
                            ? 'border-wabi-600 shadow-md'
                            : 'border-surface-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" aria-hidden="true" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={handleRetakeAll} className="btn-secondary btn-lg flex-1" title="Shortcut: R" aria-keyshortcuts="r">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      New burst <kbd className="ml-1 hidden sm:inline-flex items-center px-1 py-0.5 rounded border border-surface-300 bg-white text-[10px] font-mono">R</kbd>
                    </button>
                    <button
                      onClick={() => {
                        setEditingSrc(displayBurstSrc);
                        setEditingTarget('burst');
                      }}
                      className="btn-ghost btn-lg flex-1 border border-surface-200"
                    >
                      ✎ Edit
                    </button>
                    <a
                      href={displayBurstSrc}
                      download={`candid-burst-${selectedGalleryIndex + 1}.jpg`}
                      className="btn-success btn-lg flex-1 flex items-center justify-center gap-2"
                      title="Shortcut: D"
                      aria-keyshortcuts="d"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download <kbd className="ml-1 hidden sm:inline-flex items-center px-1 py-0.5 rounded border border-white/30 bg-white/20 text-[10px] font-mono">D</kbd>
                    </a>
                  </div>
                  <p className="text-[11px] text-ink-500 text-center">Shortcuts: <kbd className="px-1 py-0.5 rounded border border-paper-border bg-white text-[10px] font-mono">R</kbd> new burst · <kbd className="px-1 py-0.5 rounded border border-paper-border bg-white text-[10px] font-mono">D</kbd> download · <kbd className="px-1 py-0.5 rounded border border-paper-border bg-white text-[10px] font-mono">Esc</kbd> leave</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={async () => {
                        const r = await shareImage(displayBurstSrc, `candid-burst-${selectedGalleryIndex + 1}.jpg`, 'Candid burst');
                        flashNote(r === 'shared' ? 'Shared ✓' : r === 'copied' ? 'Copied ✓' : 'Download instead');
                      }}
                      className="btn-ghost btn-sm border border-surface-200"
                    >
                      Share
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await copyImageToClipboard(displayBurstSrc);
                        flashNote(ok ? 'Copied image ✓' : 'Copy failed');
                      }}
                      className="btn-ghost btn-sm border border-surface-200"
                    >
                      Copy image
                    </button>
                  </div>

                  <div className="pt-4 border-t border-surface-200 space-y-3">
                    <p className="text-body-sm font-medium text-surface-700 text-center">Polaroid — single pick</p>
                    <input
                      value={polaroidCaption}
                      onChange={(e) => setPolaroidCaption(e.target.value)}
                      placeholder="Caption"
                      maxLength={24}
                      className="input text-center"
                    />
                    <button
                      onClick={async () => {
                        const p = await buildPolaroid(displayBurstSrc, polaroidCaption || 'Candid · wabi-sabi', seasonalFrame);
                        setPolaroidBurst(p);
                      }}
                      className="btn-secondary btn-md w-full"
                    >
                      Make Polaroid {seasonalFrame !== 'none' ? `· ${seasonalFrame}` : ''}
                    </button>
                    {polaroidBurst && (
                      <div className="space-y-3 animate-in">
                        <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow border border-surface-200 bg-white">
                          <img src={polaroidBurst} alt="Polaroid preview" className="w-full h-auto" />
                        </div>
                        <a href={polaroidBurst} download="candid-polaroid-burst.jpg" className="btn-success btn-md w-full flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Polaroid
                        </a>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={async () => {
                              const r = await shareImage(polaroidBurst!, 'candid-polaroid-burst.jpg', 'Candid polaroid');
                              flashNote(r === 'shared' ? 'Shared ✓' : r === 'copied' ? 'Copied ✓' : 'Download instead');
                            }}
                            className="btn-ghost btn-sm border border-surface-200"
                          >
                            Share polaroid
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await copyImageToClipboard(polaroidBurst!);
                              flashNote(ok ? 'Copied ✓' : 'Copy failed');
                            }}
                            className="btn-ghost btn-sm border border-surface-200"
                          >
                            Copy image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collage builder — wabi-sabi extra */}
                  <div className="pt-6 border-t border-surface-200 space-y-4">
                    <h4 className="text-heading-sm font-semibold text-surface-900 text-center">Make a collage</h4>
                    <p className="text-body-sm text-surface-600 text-center">Combine all {burstImages.length} shots into one wabi-sabi collage</p>
                    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Collage layout">
                      {(['strip', 'grid'] as const).map((layout) => (
                        <button
                          key={layout}
                          type="button"
                          role="radio"
                          aria-checked={collageChoice === layout}
                          onClick={() => setCollageChoice(layout)}
                          className={`px-4 py-2 rounded-full text-body-sm transition-all duration-fast capitalize ${
                            collageChoice === layout
                              ? 'bg-wabi-500 text-surface-950 font-medium shadow-sm'
                              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                          }`}
                        >
                          {layout === 'strip' ? 'Strip' : 'Grid'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => createCollage(collageChoice, seasonalFrame)}
                      className="btn-primary btn-lg w-full max-w-lg mx-auto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Create Collage — {collageChoice === 'strip' ? 'Strip' : 'Grid'} {seasonalFrame !== 'none' ? `· ${seasonalFrame}` : ''}
                    </button>

                    {collageImage && (
                      <div className="space-y-4 animate-in">
                        <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-lg border border-surface-200 bg-white">
                          <img
                            src={displayCollage!}
                            alt={`Collage — ${collageChoice} layout with ${burstImages.length} shots`}
                            className="w-full h-auto"
                          />
                        </div>
                        <div className="flex gap-3 max-w-lg mx-auto">
                          <button
                            onClick={() => {
                              setEditingSrc(displayCollage!);
                              setEditingTarget('collage');
                            }}
                            className="btn-ghost btn-md flex-1 border border-surface-200"
                          >
                            ✎ Edit collage
                          </button>
                          <a
                            href={displayCollage!}
                            download={`candid-collage-${collageChoice}.jpg`}
                            className="btn-success btn-md flex-1 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </div>
                        <div className="flex gap-2 justify-center max-w-lg mx-auto">
                          <button
                            onClick={async () => {
                              const r = await shareImage(displayCollage!, `candid-collage-${collageChoice}.jpg`, 'Candid collage');
                              flashNote(r === 'shared' ? 'Shared ✓' : r === 'copied' ? 'Copied ✓' : 'Download instead');
                            }}
                            className="btn-ghost btn-sm border border-surface-200"
                          >
                            Share collage
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await copyImageToClipboard(displayCollage!);
                              flashNote(ok ? 'Copied image ✓' : 'Copy failed');
                            }}
                            className="btn-ghost btn-sm border border-surface-200"
                          >
                            Copy image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {burstImages.length > 0 && captureState !== 'gallery' && captureState !== 'idle' && captureState !== 'result' && (
                <div className="pt-4 text-center text-caption text-surface-500 animate-in">
                  Burst progress: {burstImages.length}/{burstCount} shots — collage will appear after {burstCount} shots
                </div>
              )}

              {burstImages.length > 1 && captureState === 'result' && (
                <div className="pt-6 border-t border-surface-200 space-y-4 animate-in">
                  <h4 className="text-heading-sm font-semibold text-surface-900 text-center">Make a collage</h4>
                  <p className="text-body-sm text-surface-600 text-center">You have {burstImages.length} shots so far — finish burst to build collage, or create one now</p>
                  <div className="flex items-center justify-center gap-2">
                    {(['strip', 'grid'] as const).map((layout) => (
                      <button
                        key={layout}
                        type="button"
                        onClick={() => setCollageChoice(layout)}
                        className={`px-4 py-2 rounded-full text-body-sm capitalize ${collageChoice === layout ? 'bg-wabi-500 text-surface-950 font-medium shadow-sm' : 'bg-surface-100 text-surface-600'}`}
                      >
                        {layout}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => createCollage(collageChoice, seasonalFrame)} className="btn-primary btn-lg w-full max-w-lg mx-auto">
                    Create Collage — {collageChoice === 'strip' ? 'Strip' : 'Grid'} {seasonalFrame !== 'none' ? `· ${seasonalFrame}` : ''}
                  </button>
                  {collageImage && (
                    <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow border border-surface-200 bg-white">
                      <img src={collageImage} alt="Collage preview" className="w-full h-auto" />
                    </div>
                  )}
                </div>
              )}

{cameraError && (
                <div className="animate-in" role="alert">
                  <div className="flex items-start gap-3 p-4 bg-stone-100 border border-surface-300 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-stone-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700">Camera Error</p>
                      <p className="text-sm text-stone-600 mt-1">{cameraError!.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {webrtcError && (
                <div className="animate-in" role="alert">
                  <div className="flex items-start gap-3 p-4 bg-clay-100 border border-surface-300 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-clay-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-clay-800" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-clay-800">Connection Issue</p>
                      <p className="text-sm text-clay-800 mt-1">{webrtcError!.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {captureError && (
                <div className="animate-in" role="alert">
                  <div className="flex items-start gap-3 p-4 bg-stone-100 border border-surface-300 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-stone-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700">Capture Error</p>
                      <p className="text-sm text-stone-600 mt-1">{captureError!.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {captureState === 'idle' && (
                <div className="pt-4 animate-in space-y-6">
                  <div className="hidden sm:block">
                    <FilterSelector selected={filter} onSelect={setFilter} />
                  </div>
                  <p className="sm:hidden text-center text-[11px] text-ink-500 -mt-2">Swipe on your camera to change filters — like Insta • Try it!</p>
                  <SeasonalSelector selected={seasonalFrame} onSelect={setSeasonalFrame} />
                  <ThemeSwitcher />
                  <div className="card p-4 border-paper-border/80 bg-paper-50/70">
                    <p className="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-3 text-center">Creative extras (optional)</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <label className="flex items-center gap-2 p-2 rounded-organic-sm bg-white border border-paper-border cursor-pointer"><input type="checkbox" checked={promptEnabled} onChange={e=>setPromptEnabled(e.target.checked)} className="accent-clay" /> Prompt card</label>
                      <label className="flex items-center gap-2 p-2 rounded-organic-sm bg-white border border-paper-border cursor-pointer"><input type="checkbox" checked={bgBlur} onChange={e=>setBgBlur(e.target.checked)} className="accent-clay" /> Cozy blur bg</label>
                      <label className="flex items-center gap-2 p-2 rounded-organic-sm bg-white border border-paper-border cursor-pointer"><input type="checkbox" checked={doubleExposure} onChange={e=>setDoubleExposure(e.target.checked)} className="accent-clay" /> Double exposure</label>
                      <label className="flex items-center gap-2 p-2 rounded-organic-sm bg-white border border-paper-border cursor-pointer"><input type="checkbox" checked={boomerang} onChange={e=>setBoomerang(e.target.checked)} className="accent-clay" /> Boomerang clip</label>
                      <label className="flex items-center gap-2 p-2 rounded-organic-sm bg-white border border-paper-border cursor-pointer"><input type="checkbox" checked={soundEnabled} onChange={e=>setSoundEnabled(e.target.checked)} className="accent-clay" /> Shutter sounds</label>
                      <label className="flex items-center gap-2 p-2 rounded-organic-sm bg-white border border-paper-border cursor-pointer"><input type="checkbox" checked={hapticEnabled} onChange={e=>setHapticEnabled(e.target.checked)} className="accent-clay" /> Haptic</label>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[11px] text-ink-500">Washi tape</span>
                      {['#E5BF94','#3E4D3A','#BD5338','#4A6B82','#F5EFEB'].map(c=>(
                        <button key={c} onClick={()=>setWashiColor(c)} className={`w-6 h-6 rounded-full border ${washiColor===c?'ring-2 ring-clay':''}`} style={{background:c}} aria-label={c} />
                      ))}
                    </div>
                    <p className="text-[11px] text-ink-500 text-center mt-2">All extras are opt-in — enable only what you want</p>
                  </div>
                  <div className="animate-in">
                    <p className="text-body-sm font-medium text-surface-700 mb-3 text-center">Shots</p>
                    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Number of shots">
                      {[
                        { count: 1, label: 'Single' },
                        { count: 3, label: 'Burst ×3' },
                      ].map((option) => {
                        const active = option.count === burstCount;
                        return (
                          <button
                            key={option.count}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setBurstCount(option.count)}
                            className={`px-4 py-2 rounded-full text-body-sm transition-all duration-fast ${
                              active
                                ? 'bg-wabi-500 text-surface-950 font-medium shadow-sm'
                                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="animate-in">
                    <p className="text-body-sm font-medium text-surface-700 mb-3 text-center">Countdown</p>
                    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Countdown length">
                      {[3, 5, 10].map((seconds) => {
                        const active = seconds === durationSec;
                        return (
                          <button
                            key={seconds}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setDurationSec(seconds)}
                            className={`px-4 py-2 rounded-full text-body-sm transition-all duration-fast ${
                              active
                                ? 'bg-wabi-500 text-surface-950 font-medium shadow-sm'
                                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                            }`}
                          >
                            {seconds}s
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-surface-200">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-body-sm text-surface-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-wabi-500" aria-hidden="true" />
                    <span>Participant A</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pine-600" aria-hidden="true" />
                    <span>Participant B</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {isDebug && (
        <div className="max-w-4xl w-full mt-6 p-3 bg-ink-900 text-green-300 font-mono text-xs rounded-lg overflow-auto max-h-[320px] border border-ink-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-cream">DEBUG (?debug=1)</span>
            <button onClick={() => { localStorage.removeItem('candid_debug'); location.search=''; }} className="text-[10px] px-2 py-1 rounded bg-white/10 border border-white/20">Hide (?debug=0)</button>
          </div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <footer className="max-w-4xl w-full mt-8 text-center">
        <p className="text-caption text-surface-400">©️ Mewn</p>
      </footer>

      {editingSrc && (
        <PhotoEditor
          src={editingSrc}
          onClose={() => {
            setEditingSrc(null);
            setEditingTarget(null);
          }}
          onSave={(edited) => {
            if (editingTarget === 'single') setEditedSingle(edited);
            else if (editingTarget === 'burst') setEditedBurst((prev) => ({ ...prev, [selectedGalleryIndex]: edited }));
            else if (editingTarget === 'collage') setEditedCollage(edited);
          }}
        />
      )}
      {doodleTarget && <DoodleOverlay src={doodleTarget} onClose={()=>setDoodleTarget(null)} onSave={(url)=>{ setEditedSingle(url); setDoodleTarget(null); }} />}
      {stickerTarget && <StickerOverlay src={stickerTarget} onClose={()=>setStickerTarget(null)} onSave={(url)=>{ setEditedSingle(url); setStickerTarget(null); }} />}
    </div>
  );
};