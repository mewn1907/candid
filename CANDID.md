# CANDID — Product & Technical Specification

**Product:** Candid
**Tagline:** Two people. One virtual frame.
**Copyright:** ©️ Mewn

---

# 1. PRODUCT

Candid is a browser-based virtual photobooth for exactly two people who are physically far apart.

Person A and Person B use different devices. They can:

1. Create a private room.
2. Share the room with another person.
3. Join from another device.
4. Allow camera access.
5. See their own camera.
6. See the other person's camera.
7. Start a synchronized countdown.
8. Capture both participants.
9. Combine both images into one virtual photobooth photograph.
10. Preview the result.
11. Retake the photograph.
12. Download the final image.

The experience should feel playful, simple, fast, private, modern, and mobile-friendly.

---

# 2. MVP DEFINITION

The MVP flow is:

```text
Landing → Create Room → Share Room → Join Room → Two Participants
Connected → Camera → WebRTC → Synchronized Countdown → Capture →
Compose → Preview → Download
```

Out of scope for MVP: accounts, social login, payments, subscriptions,
public profiles, cloud photo gallery, AI photo generation, AI filters,
multi-person rooms, chat, unnecessary analytics, unnecessary database,
unnecessary third-party services.

---

# 3. COPYRIGHT

The product must contain **©️ Mewn**, in the application footer and final
photo branding. Do not remove, replace, or rename it.

---

# 4. TECHNOLOGY

Frontend: React, TypeScript, Vite, Tailwind CSS.
Backend: Node.js, TypeScript, Fastify, Socket.IO.
Browser APIs: `getUserMedia()`, `RTCPeerConnection`, `RTCDataChannel`,
`HTMLVideoElement`, `HTMLCanvasElement`, `CanvasRenderingContext2D`.
Testing: Vitest (unit/integration), manual two-browser verification for WebRTC.

---

# 5. ARCHITECTURE

```text
                    ┌──────────────────────┐
                    │     SIGNALING        │
                    │   Node + Socket.IO   │
                    └──────────┬───────────┘
                               │ signaling only
                               │ (offer/answer/ICE)
               ┌───────────────┴───────────────┐
               ▼                               ▼
        ┌──────────────┐               ┌──────────────┐
        │   Browser A  │◄── WebRTC ──►│   Browser B  │
        │ Local Camera │   peer media  │ Local Camera │
        └──────────────┘               └──────────────┘
```

The server handles room creation/joining, presence, WebRTC signaling, and
capture coordination. It does not transport live video.

---

# 6. PRIVACY

Camera data is not stored on the server. Live video uses WebRTC.
Captured images are exchanged peer-to-peer (via signaling relay, never
persisted). No camera frames go to third-party services. No analytics or
tracking without explicit approval.

---

# 7. ROOM MODEL

Exactly two participants per room: `roomId`, `participantA`,
`participantB`, `createdAt`, `expiresAt`. Unknown rooms are rejected, a
third participant is rejected, disconnected participants are cleaned up,
expired rooms are removed, and clients cannot modify room state directly.

---

# 8. ROOM SECURITY

Room IDs are cryptographically random (`nanoid(10)`), never trivial.
Server input is validated, room creation is rate-limited, and server
internals are never exposed.

---

# 9. SIGNALING

Socket.IO with typed events:

```text
room:create, room:join, room:rejoined, room:participant-joined,
room:participant-left, room:error
webrtc:offer, webrtc:answer, webrtc:ice-candidate
capture:prepare, capture:countdown, capture:execute,
capture:complete, capture:result
```

---

# 10. SOCKET EVENT RULE

Every network event has a defined payload, validation, clear sender and
receiver, and clear error behavior. Payloads use TypeScript types and zod
schemas — never arbitrary untyped objects.

---

# 11. WEBRTC

One `RTCPeerConnection` per participant. Offers, answers, and ICE
candidates are exchanged through signaling; media flows peer-to-peer.

# 12. WEBRTC RULES

Verify unfamiliar WebRTC behavior against existing code and official docs.
Keep WebRTC code separate from UI (never all inside `App.tsx`).

---

# 13. CAMERA

Request camera access only when entering the camera experience. Handle
permission denied, unavailable/in-use camera, unsupported browsers,
stopped streams, and disconnected devices. Stop every media track when
leaving.

# 14. CAMERA PRIVACY

No secret activation, no automatic recording, no footage storage, no
unnecessary video transmission. Video only — no microphone.

---

# 15. UI STRUCTURE

Screens: Landing (Create/Join Room) → Room (Waiting → Connecting →
Camera → Countdown → Capturing → Result → Error). UI state is explicit,
driven by the capture state machine rather than scattered booleans.

---

# 16. CAPTURE STATE MACHINE

```text
IDLE → PREPARING → COUNTDOWN → CAPTURING → COMPOSING → RESULT → IDLE
```

Retake returns `RESULT → IDLE`. Invalid transitions (e.g.
`CAPTURING → PREPARING`) are rejected with an explicit error.

---

# 17. SYNCHRONIZED COUNTDOWN

The server creates a capture ID and a future target timestamp; both
clients count down to it locally, capture near the target, and exchange
images under the same capture ID. Never assume two `setTimeout`s stay
in sync, and never assume browser clocks match exactly.

---

# 18. CAPTURE

Capture from the `<video>` element to canvas only on demand. Compress
images for peer transfer; avoid huge dimensions.

---

# 19. DATA CHANNEL

Captured photographs are exchanged as compact images through signaling
relay. Resize/compress/validate before transfer; never grow memory
unboundedly.

---

# 20. COMPOSITOR

`client/src/features/capture/` holds mostly-pure composition logic:
accept participant images, fit/crop, compose, add frame and branding,
export a Blob. Kept separate from React UI.

---

# 21. INITIAL PHOTO DESIGN

Simple two-panel composition with original Candid visual identity:

```text
┌─────────────────────────────┐
│          CANDID             │
├──────────────┬──────────────┤
│   PERSON A   │   PERSON B   │
├──────────────┴──────────────┤
│          ©️ Mewn            │
└─────────────────────────────┘
```

---

# 22. RESULT

After capture: final photo preview with Retake and Download actions.
The result must survive accidental clicks elsewhere.

---

# 23. DOWNLOAD

Final image download as JPEG/PNG via client-side anchor. No permanent
server storage.

---

# 24. ERROR STATES

Every major failure gets a plain-language, user-facing error:
`ROOM_NOT_FOUND`, `ROOM_FULL`, `CAMERA_PERMISSION_DENIED`,
`CAMERA_UNAVAILABLE`, `CONNECTION_FAILED`, `PEER_DISCONNECTED`,
`WEBRTC_FAILED`, `CAPTURE_FAILED`, `CAPTURE_TIMEOUT`, `INVALID_STATE`.

---

# 25. RECONNECTION

Handle browser refresh (sessionStorage + rejoin), network drops, and
participant leave/rejoin. No duplicate peer connections or listeners;
clean up before replacing.

---

# 26. MEMORY MANAGEMENT

Care with `MediaStream`s, blob URLs (`revokeObjectURL`), canvases,
WebRTC connections, and listeners. No leaks.

---

# 27. FRONTEND ARCHITECTURE

`components/`, `features/` (`room/`, `media/`, `webrtc/`, `capture/`,
`landing/`), `hooks/`, `lib/`, `types/`. Separate responsibilities.

---

# 28. BACKEND ARCHITECTURE

`server/src/` with `rooms/`, `signaling/`, `capture/`, `config/`,
`index.ts`. No god-files.

---

# 29. CONFIGURATION

Environment variables with `.env.example` files. Never commit `.env`,
never hardcode secrets, never put secrets in frontend code.

---

# 30. TURN/STUN

Google STUN for development; TURN via `TURN_URLS`/`TURN_USERNAME`/
`TURN_PASSWORD`, served to clients through `GET /ice-servers`.
Credentials only from environment.

---

# 31. SECURITY

Validate all external input: room IDs, socket payloads, event types,
image sizes/MIME types, capture IDs. The server is authoritative for
room membership. Never trust the browser.

---

# 32. DOS / ABUSE PROTECTION

Room-creation rate limiting (HTTP + per-socket + per-IP cap), payload
size limits, room expiration, two-participant maximum.

---

# 33. CORS

Explicit origin allowlist from `CORS_ORIGIN` (comma-separated). No
wildcard in production.

---

# 34. CSP

Helmet with a deliberate Content Security Policy that does not break
WebRTC or Socket.IO polling.

---

# 35. ACCESSIBILITY

Keyboard navigation, visible focus, readable text, accessible labels,
clear buttons, sufficient contrast. Controls are more than icons.

---

# 36. MOBILE

Must work on mobile browsers: viewport, camera permissions,
orientation, button sizes, scrolling, video aspect ratio, result image,
download behavior.

---

# 37. PERFORMANCE

Keep it lightweight: no unnecessary libraries, no per-frame canvas
processing, no repeated image encoding, no oversized messages.

---

# 49. CODING STYLE

TypeScript with explicit types, small pure functions, descriptive names,
early validation, clear error handling. No giant components, no `any`
without need, no magic numbers, no global mutable state.

---

# 50. REACT RULES

Small components; every effect has a reason; clean up streams,
listeners, timers, and connections on unmount.

---

# 51. SERVER RULES

Validate input, manage rooms/signaling, clean resources, avoid
unnecessary persistence. Never trust client-provided identity.

---

# 52. TESTING

Every milestone is verified with typecheck, lint, tests, and build
where those commands exist. Never claim PASS without running the command.

---

# 53. TESTING PHILOSOPHY

Test behavior: room creation/joining/full/cleanup, invalid payloads,
capture transitions, composition output, image dimensions.

---

# 54. WEBRTC TESTING

Unit-test pure logic, integration-test signaling, verify real peer
connections manually in two browsers. Unit tests don't prove WebRTC works.

---

# 55. E2E TEST

Two browser contexts: A creates, B joins, both see each other, capture
runs, both receive the result, download works.

---

# 56. MILESTONE SYSTEM

Built in order, all complete: M0 Foundation, M1 Landing/Rooms UI,
M2 Room Server, M3 Camera, M4 WebRTC, M5 Synchronized Countdown,
M6 Capture + Composition, M7 Visual Polish, M8 Reliability,
M9 Security/Privacy, M10 Production.

Post-v1 extras (shipped): invite links + QR, photo finishes, countdown
options, burst mode, collage builder, preview polish, quick edit,
polaroid export, sounds, share polish.

---

# 79. AI FEATURES

AI is not part of the product. No AI inference in the web application.

---

# 80. FUTURE IDEAS

Photo strips, frames, filters, stickers, QR invitations, PWA,
multi-person rooms. These belong after MVP.

---

# 81. BRANDING

Application: **Candid**. Copyright: **©️ Mewn**. Original visual
identity — currently a wabi-sabi theme celebrating imperfection.

---

# 82. FINAL UX

```text
OPEN CANDID → CREATE ROOM → SHARE LINK → FRIEND JOINS →
CAMERAS CONNECT → "READY?" → 3·2·1 → PHOTO →
FINAL SHARED FRAME → RETAKE / DOWNLOAD
```

Minimize unnecessary clicks.

---

# 83. FINAL QUALITY BAR

A feature is finished only when: it is implemented, types pass, lint
passes, tests pass, browser behavior works, errors are handled, cleanup
works, and mobile/privacy/security were considered.

---

# 84. FINAL CHECKLIST

Product: create/join room ✅, two-person limit ✅, camera ✅, remote
video ✅, countdown ✅, capture ✅, composition ✅, preview ✅,
retake ✅, download ✅, ©️ Mewn ✅.
Reliability: refresh ✅, disconnect/reconnect ✅, camera denial/failure ✅,
room expiration ✅, duplicate events ✅, mobile ✅.
Security: input/payload validation ✅, no secrets in frontend/Git ✅,
CORS ✅, rate limiting ✅, room expiration ✅, payload limits ✅.
Quality: typecheck ✅, lint ✅, unit/integration tests ✅, production
build ✅. Remaining: two-browser E2E with real cameras, production deploy.

---

**©️ Mewn**
