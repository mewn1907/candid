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
import { canvasFilterFor } from '../capture/filters';

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
  } = useRoomContext();
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
    if (roomId) {
      joinRoom(roomId).catch(() => {
        navigate('/', { replace: true });
      });
    }
  }, [roomId, joinRoom, navigate]);

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
    if (isConnected && localStream) {
      createOffer().catch((err: unknown) => {
        console.error('[RoomView] Failed to create offer:', err);
      });
    }
  }, [isConnected, localStream, createOffer]);

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

  // Extra feature 4: sound + flash
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (captureState === 'capturing') {
      playShutter();
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 280);
      return () => clearTimeout(t);
    }
  }, [captureState]);

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

  // Extra feature 5: share polish
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [roomIdCopied, setRoomIdCopied] = useState(false);
  const flashNote = (msg: string) => {
    setShareNote(msg);
    setTimeout(() => setShareNote(null), 2200);
  };

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

  // Extract countdown display value to satisfy TypeScript type narrowing in JSX
  const countdownDisplay = countdown !== null && countdown > 0 ? countdown : null;
  const waitingRoomId = isWaiting ? currentRoom?.id ?? null : null;
  const burstProgress =
    burstPlan && burstPlan.total > 1
      ? `Shot ${Math.min(burstPlan.index, burstPlan.total)} of ${burstPlan.total}`
      : null;

  const prevCountdownRef = useRef<number | null>(null);
  useEffect(() => {
    if (captureState === 'countdown' && countdownDisplay !== null && countdownDisplay !== prevCountdownRef.current) {
      prevCountdownRef.current = countdownDisplay;
      if (countdownDisplay > 0) playTick();
    }
    if (captureState !== 'countdown') prevCountdownRef.current = null;
  }, [captureState, countdownDisplay]);

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
        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <h1 className="text-display-sm font-light text-surface-900 tracking-tight">Room: <span className="text-wabi-700">{currentRoom?.id}</span></h1>
            <p className="mt-1 text-body-md text-surface-600">
              Your participant ID: <span className="font-mono font-semibold text-wabi-700">{currentParticipantId}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            >
              Leave Room
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
                        const ok = await copyText(currentRoom?.id ?? '');
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
                          const link = `${window.location.origin}/join/${currentRoom?.id ?? ''}`;
                          try {
                            await (navigator as unknown as { share: (d: ShareData) => Promise<void> }).share({
                              title: 'Join my Candid room',
                              text: `Join room ${currentRoom?.id}`,
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
                  {currentRoom?.id}
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
                />

                <RemoteVideo
                  stream={remoteStream}
                  participantLabel={otherParticipantLabel}
                  connectionState={connectionState}
                />
              </div>
              {filter !== 'natural' && (
                <p className="text-caption text-center text-surface-500">Preview: {filter} filter will be applied at capture</p>
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
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retake
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
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
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
                  {shareNote && <p className="text-caption text-center text-surface-500">{shareNote}</p>}
                  <div className="pt-4 border-t border-surface-200 space-y-3">
                    <p className="text-body-sm font-medium text-surface-700 text-center">Polaroid — wabi strip</p>
                    <input
                      value={polaroidCaption}
                      onChange={(e) => setPolaroidCaption(e.target.value)}
                      placeholder="Caption"
                      maxLength={24}
                      className="input text-center"
                    />
                    <button
                      onClick={async () => {
                        const p = await buildPolaroid(displaySingle!, polaroidCaption || 'Candid · wabi-sabi');
                        setPolaroidSingle(p);
                      }}
                      className="btn-secondary btn-md w-full"
                    >
                      Make Polaroid
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
                    <button onClick={handleRetakeAll} className="btn-secondary btn-lg flex-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      New burst
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
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
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
                        const p = await buildPolaroid(displayBurstSrc, polaroidCaption || 'Candid · wabi-sabi');
                        setPolaroidBurst(p);
                      }}
                      className="btn-secondary btn-md w-full"
                    >
                      Make Polaroid
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
                      onClick={() => createCollage(collageChoice)}
                      className="btn-primary btn-lg w-full max-w-lg mx-auto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Create Collage — {collageChoice === 'strip' ? 'Strip' : 'Grid'}
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
                  <button onClick={() => createCollage(collageChoice)} className="btn-primary btn-lg w-full max-w-lg mx-auto">
                    Create Collage — {collageChoice === 'strip' ? 'Strip' : 'Grid'}
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
                  <FilterSelector selected={filter} onSelect={setFilter} />
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
                  <button
                    onClick={startCapture}
                    disabled={!localStream}
                    className="btn-primary btn-lg w-full"
                    aria-disabled={!localStream}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Start Capture</span>
                  </button>
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
    </div>
  );
};