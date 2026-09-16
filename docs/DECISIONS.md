// ©️ Mewn

# Architecture Decisions

## Participant ID
**Decision:** Server-assigned (A/B)
**Rationale:** Clients must not choose their participant ID. First participant gets 'A', second gets 'B'.
**Date:** 2026-09-14

## Room ID
**Decision:** Server-generated using `nanoid(10)`
**Rationale:** Cryptographically random, URL-safe, ~10 characters. Client must not select or control room ID.
**Date:** 2026-09-14

## Persistence
**Decision:** In-memory only (Map) for MVP
**Rationale:** No Redis, database, or persistent storage. Room state exists only for active session, cleaned up when empty/expired.
**Date:** 2026-09-14

## TURN/STUN
**Decision:** STUN for development (`stun:stun.l.google.com:19302`), TURN config ready for production
**Rationale:** Local dev may work without TURN. Configuration centralized and configurable, not hardcoded.
**Date:** 2026-09-14

## Routing
**Decision:** `react-router-dom` for minimal explicit route structure
**Rationale:** Aligned with MVP flow (Landing → Room), avoids growing state-based conditional rendering.
**Date:** 2026-09-14

## Clipboard API
**Decision:** `navigator.clipboard.writeText()` with fallback
**Rationale:** Graceful handling for browsers where Clipboard API is unavailable or fails.
**Date:** 2026-09-14

## Signaling Transport
**Decision:** Socket.IO
**Rationale:** Per CANDID.md §9, typed events for room management, WebRTC signaling, and capture coordination.
**Date:** 2026-09-14

## Max Participants
**Decision:** Exactly 2 (hardcoded)
**Rationale:** MVP requirement per CANDID.md §7. Room rejects 3rd participant.
**Date:** 2026-09-14

## Camera API
**Decision:** `navigator.mediaDevices.getUserMedia()` with constraints
**Rationale:** Standard browser API for camera access. Audio disabled for MVP.
**Date:** 2026-09-15

## Camera Constraints
**Decision:** 1280x720 ideal resolution, facingMode 'user' (front) default, switchable to 'environment' (back)
**Rationale:** Good balance of quality and performance. Front camera default for selfie-style photobooth.
**Date:** 2026-09-15

## Camera Cleanup
**Decision:** Stop all tracks on unmount, leave room, or stop button
**Rationale:** Per CANDID.md §13, must stop every media track when leaving camera experience. Prevents resource leaks.
**Date:** 2026-09-15

## Camera Error Handling
**Decision:** Explicit error codes (PERMISSION_DENIED, CAMERA_UNAVAILABLE, CAMERA_IN_USE, UNSUPPORTED_BROWSER, STREAM_STOPPED, DEVICE_DISCONNECTED) with user-friendly messages
**Rationale:** Per CANDID.md §13 and §24, handle all major camera failures with understandable messages.
**Date:** 2026-09-15

## WebRTC Peer Connection
**Decision:** One RTCPeerConnection per participant (MVP has exactly 2 participants)
**Rationale:** Per CANDID.md §11 and §12, simple peer-to-peer setup with direct connection between the two participants.
**Date:** 2026-09-15

## WebRTC Signaling
**Decision:** Socket.IO for offer/answer/ICE candidate exchange
**Rationale:** Per CANDID.md §9 and §11, server relays signaling messages but does not transport media.
**Date:** 2026-09-15

## WebRTC ICE Servers
**Decision:** Google STUN server (`stun:stun.l.google.com:19302`) for development
**Rationale:** Standard public STUN server for NAT traversal in development. Production will need TURN.
**Date:** 2026-09-15

## WebRTC Media Constraints
**Decision:** Video only (no audio), 1280x720 ideal resolution
**Rationale:** Per CANDID.md §14, MVP primarily needs camera/video. Audio disabled unless there's a real product reason.
**Date:** 2026-09-15

## Capture State Machine
**Decision:** Explicit states: idle → preparing → countdown → capturing → composing → result → idle (retake)
**Rationale:** Per CANDID.md §16, invalid transitions must not silently succeed. Only forward transitions allowed except result→idle for retake.
**Date:** 2026-09-15

## Synchronized Countdown
**Decision:** Server generates captureId and targetTime, clients calculate local countdown from targetTime
**Rationale:** Per CANDID.md §17, do not rely on setTimeout on both machines. Server is authoritative for timing.
**Date:** 2026-09-15

## Capture Composition
**Decision:** Side-by-side two-panel composition with CANDID branding and ©️ Mewn copyright
**Rationale:** Per CANDID.md §21, simple two-panel design. Participant A on left, B on right.
**Date:** 2026-09-15

## Capture Download
**Decision:** Data URL download via anchor tag with download attribute
**Rationale:** Per CANDID.md §23, no permanent server storage. Client-side download only.
**Date:** 2026-09-15

## Design System
**Decision:** Tailwind CSS with custom design tokens (colors, typography, spacing, shadows, animations)
**Rationale:** Consistent visual identity across components. Candid brand color (orange), Inter font, custom animations.
**Date:** 2026-09-15

## Component Library
**Decision:** Utility-first component classes (btn, input, card, badge) via @layer components
**Rationale:** Consistent styling, easy to maintain, works with Tailwind's utility-first approach.
**Date:** 2026-09-15

## Animations
**Decision:** Custom keyframes for fade, slide, scale, pulse, bounce, shimmer
**Rationale:** Smooth UX transitions. Countdown numbers, loading states, hover effects.
**Date:** 2026-09-15

## Accessibility
**Decision:** Semantic HTML, ARIA labels, focus-visible rings, color contrast, keyboard navigation
**Rationale:** Per CANDID.md §35, core controls must support keyboard nav, visible focus, readable text, accessible labels.
**Date:** 2026-09-15

## Responsive Design
**Decision:** Mobile-first, breakpoints at sm (640px) and lg (1024px), touch-friendly targets (44px min)
**Rationale:** Per CANDID.md §36, application must work on mobile browsers with proper viewport, button sizes, scrolling.
**Date:** 2026-09-15

## Session Persistence
**Decision:** sessionStorage for room ID and participant ID; auto-rejoin on page refresh
**Rationale:** Per CANDID.md §25, handle browser refresh gracefully. sessionStorage survives refresh but not tab close.
**Date:** 2026-09-15

## WebRTC Reconnection
**Decision:** ICE restart with exponential backoff (max 3 attempts); server-authoritative ICE restart signaling
**Rationale:** Per CANDID.md §25, handle network interruptions gracefully. ICE restart is the standard WebRTC recovery mechanism.
**Date:** 2026-09-15

## Camera Permission Recovery
**Decision:** Explicit "Retry with Permission" button for PERMISSION_DENIED; uses navigator.permissions.query() to check status
**Rationale:** Per CANDID.md §13 and §24, provide clear recovery path for permission denied. Don't require manual browser settings navigation.
**Date:** 2026-09-15

## Network Status Indicator
**Decision:** Real-time connection status badge (connected/reconnecting/disconnected) in room header
**Rationale:** Per CANDID.md §24, users must understand connection state. Visual feedback reduces confusion during network issues.
**Date:** 2026-09-15

## Socket.io Built-in Events
**Decision:** Type Socket.io built-in events (reconnect, reconnect_attempt, reconnect_failed, connect, disconnect, connect_error) in ServerToClientEvents
**Rationale:** Type safety for reconnection handling. These are ManagerReservedEvents from socket.io.
**Date:** 2026-09-15