# Candid - Miles apart. Frames together.

[![Open in GitHub Codespaces](https://img.shields.io/badge/Open%20in-GitHub%20Codespaces-24292e.svg)](https://codespaces.new/mewn1907/candid)

## Current Milestone

**M0 Foundation** - Project structure, basic tooling, and clean architecture setup complete.

## Working Features

- Project structure with both frontend and backend
- TypeScript configuration
- Development tooling (Vitest, linting, formatting)
- Environment configuration
- Basic folder structure
- Essential configuration files

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + TypeScript + Fastify + Socket.IO
- **WebRTC**: Peer-to-peer camera streaming
- **State Machine**: Explicit capture states
- **Privacy**: Camera data never stored on server

## Key Features

- Exactly two participants max
- Private room creation and joining
- Room security with cryptographically random IDs
- Synchronized countdown
- Capture and composition
- Download functionality

## Installation

```bash
./setup.sh
# or
cd client && npm install
cd server && npm install
```

## Development

```bash
npm run dev
# App: http://localhost:3000, API: http://localhost:8080
```

## Testing

```bash
npm test
```

## Build

```bash
npm run build
```

## License

©️ Mewn