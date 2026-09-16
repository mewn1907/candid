# Current State

## Current Milestone
M1 Landing/Rooms UI ✅ → M2 Room Server ✅ → M3 Camera ✅ → M4 WebRTC ✅ → M5 Synchronized Countdown ✅ → M6/M7 Visual Polish ✅ → M8 Reliability ✅ → M9 Security/Privacy ✅ → M10 Production ✅ (complete)

## Working Features
- Project structure with TypeScript (client + server)
- Clean separation between frontend/backend
- Development tooling (Vitest, linting, formatting)
- Basic folder structure and configuration files
- Client entry points (index.html, main.tsx, App.tsx)
- Landing page with Create/Join Room buttons
- Create Room page (auto-generates room ID via server, redirects to room)
- Join Room page (enters room ID, redirects to room)
- Room View page showing:
  - Room ID with copy-to-clipboard (fallback for older browsers)
  - Your participant ID (A or B, server-assigned)
  - Waiting/connected state with participant count
- Room Selector component (shows current room status)
- React Context with Socket.IO client for room management
- TypeScript types for Room, Participant, RoomState, CreateRoomResult, JoinRoomResult
- Routing: `/` → Landing, `/create` → CreateRoom, `/join` → JoinRoom, `/room/:roomId` → RoomView
- Clipboard copy for room ID with fallback

- Server entry point (Fastify + Socket.IO)
- Room registry (in-memory Map with TTL cleanup)
- Room service (create, join, leave, get state, rejoin)
- Socket.IO signaling handlers (room:create, room:join, room:rejoin, webrtc:*, capture:*)
- STUN configuration for WebRTC
- Health check endpoint
- Graceful shutdown handlers

- **Camera (M3):**
  - Camera permission request with `getUserMedia()`
  - Camera preview with video element (auto-play, playsInline, muted)
  - Camera controls: start/stop, switch front/back camera
  - Camera cleanup on unmount/leave (tracks stopped)
  - Error handling for:
    - PERMISSION_DENIED
    - CAMERA_UNAVAILABLE
    - CAMERA_IN_USE
    - UNSUPPORTED_BROWSER
    - STREAM_STOPPED
    - DEVICE_DISCONNECTED
  - Camera constraints: 1280x720 ideal, facingMode user/environment
  - CameraPreview component integrated in RoomView when connected
  - Proper TypeScript types for camera state, errors, constraints
  - Permission denied recovery flow with "Retry with Permission" button

- **WebRTC (M4):**
  - Peer connection abstraction (RTCPeerConnection)
  - Offer/Answer exchange via Socket.IO signaling
  - ICE candidate handling with pending candidate queue
  - Local tracks attachment from camera stream
  - Remote stream rendering in RemoteVideo component
  - Connection state monitoring (connectionState, iceConnectionState)
  - ICE restart on connection failure
  - WebRTC cleanup on unmount/leave
  - Proper TypeScript types for WebRTC state, errors, payloads

- **Synchronized Capture (M5):**
  - Capture state machine: idle → preparing → countdown → capturing → composing → result → idle (retake)
  - Server-authoritative timing: server generates captureId and targetTime
  - Synchronized countdown display (3, 2, 1) on both clients
  - Local frame capture from video element via canvas
  - Peer-to-peer image exchange via Socket.IO (capture:complete)
  - Client-side two-panel composition (Participant A left, B right) with CANDID branding and ©️ Mewn copyright
  - Final photo preview with Retake and Download buttons
  - Download via data URL anchor tag (no server storage)
  - Invalid state transitions prevented with explicit error handling

- **Visual Polish (M6/M7):**
  - Design system with Candid brand colors, typography, spacing, shadows, animations
  - Component library: btn, input, card, badge, link utilities
  - Landing page with hero animation, gradient logo, feature highlights
  - Create/Join room pages with polished forms and loading states
  - Room view with animated transitions, status indicators, responsive grid
  - Camera preview with backdrop blur, glassmorphism controls, pulse animation
  - Remote video with gradient overlay, live indicator
  - Capture countdown with large animated numbers
  - Final photo preview with shadow, border, download/retake actions
  - Accessible: focus-visible rings, ARIA labels, semantic HTML, color contrast
  - Responsive: mobile-first, breakpoints at sm/lg, touch-friendly targets
  - Animations: fade-in, slide-up, scale-in, pulse, bounce, shimmer

- **Reliability (M8):**
  - Page refresh handling - preserve room state in sessionStorage
  - Automatic rejoin on reconnect with `room:rejoin` event
  - WebRTC ICE restart on connection failure with exponential backoff
  - Camera permission denial recovery flow with "Retry with Permission" button
  - Network disconnect/reconnect handling with visual status indicator
  - Graceful error handling for all error types

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + react-router-dom + socket.io-client
- **Backend**: Node.js + TypeScript + Fastify + Socket.IO
- **WebRTC**: Peer-to-peer camera streaming with STUN
- **State Machine**: Explicit capture states (idle, preparing, countdown, capturing, composing, result)
- **Privacy**: Camera data never stored on server

- **Security / Privacy (M9):**
  - Helmet security headers with deliberate CSP (CORP/COEP off: split-origin client/server + Socket.IO polling)
  - `@fastify/rate-limit@9` + `@fastify/helmet@11` pinned for Fastify 4 (v11+ / v13+ require Fastify 5)
  - Per-IP room creation cap (`ROOM_LIMIT_PER_IP`, sliding window) enforced in room-service, stale IP entries purged on the cleanup interval
  - Strict room-ID validation (nanoid 10-char alphabet) on all socket payloads; SDP (50k) and ICE candidate (10k) size caps
  - Server tests (28 passing): registry, service, validation, socket rate limiter; `vitest.config.ts` prefers `.ts` over stale tsc `.js` artifacts

## Known Bugs
- Console warnings in client (acceptable for development)
- WebRTC connection may need TURN for some network configurations
- `socket-handler.ts` has 2 pre-existing typecheck errors (socket.io event generics)

- **Production (M10):**
  - Server-driven ICE: `GET /ice-servers` (STUN always, TURN when fully configured); client fetches once with public-STUN fallback
  - Deploy artifacts: multi-stage `Dockerfile`, `.dockerignore`, `server/.env.example`, client `.env.example` (client-only vars)
  - CORS allowlist: comma-separated `CORS_ORIGIN` → `corsOrigins[]` (verified: allowed reflected, evil denied)
  - `tsx` moved to server dependencies + `npm start` for production runners
  - Smoke-test fixes: `socket.join(roomId)` on create/join/rejoin (all room broadcasts were dead without it); capture-ID prefix check (nanoid `-` broke ~27% of captures); result broadcast no longer deleted before arrival; stale-capture purge on cleanup interval
  - Server tests: 35/35 PASS (added ICE builder + capture-ID regression tests)

- **Post-M10 bugfix pass:**
  - Client socket is mount-once (was recreated on every room change, dropping the participant)
  - Leave-room navigates home (was a permanent spinner); CreateRoomPage guards StrictMode double-create + retry button
  - `MAX_HTTP_BUFFER_SIZE` raised to 6MB (was below the 5MB composed-image cap — drops mid-capture)
  - Fixed all lint errors (JSX entities, test-file eslint override) and the 2 `socket-handler.ts` type errors
  - Docs now use real commands (`npm run dev/test`); root `dev`/`test` scripts actually run both sides

## Known Bugs
- Console warnings in client (acceptable for development)
- TURN requires manual provider credentials (by design, env-driven)

- **Invite links + QR (post-v1 feature):**
  - `/join/:roomId` deep link with auto-join (StrictMode-guarded)
  - `InvitePanel` in waiting room: copyable invite link + QR code (`react-qr-code`)
- **Photo finishes (post-v1 feature):**
  - Natural / Sepia / Mono ink / Warm fade; canvas-filter applied at capture
  - Starter's finish travels with `capture:prepare`, server-allowlisted, broadcast to both sides
- **Countdown options (post-v1 feature):**
  - 3s / 5s / 10s pills; `durationSec` validated (3–10) and drives server `targetTime`
- **Burst mode (post-v1 feature):**
  - Single / Burst ×3 pills; burst plan (`burstIndex`/`burstTotal`, 1–5) travels with `capture:prepare`
  - A-lead auto-advance (1.2s gap), stash of composed shots, gallery state with filmstrip picker + per-shot download
- **Collage builder (post-v1 feature — extra):**
  - After any burst, make a wabi-sabi collage from all shots — Strip (vertical photobooth) or Grid (2-col)
  - Client-side `buildCollage()` on burstImages: wabi paper bg, gaps, ©️ Mewn footer, JPEG export with per-collage download; coexists with single + gallery

## Next Task
v1 final verification (per CANDID.md §84):
- Two-browser E2E with real cameras (signaling flow already verified headlessly)
- Production deploy + HTTPS smoke test

## Verification
- `npm run typecheck` - PASSES (client; server has 2 pre-existing socket-handler errors)
- `npm run lint` - PASSES (client + server, warnings only)
- `npm run build` - PASSES (client + server)
- `npm run dev` - Both client and server start successfully
- `npx vitest run` (server) - 41/41 PASS
- Headless E2E smoke - create→join×2→presence→countdown→execute→relay→result PASS