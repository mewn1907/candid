// ©️ Mewn

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { buildIceServers, isTurnConfigured } from './ice';
import { setupSocketHandlers } from './signaling';

const fastify = Fastify({
  logger: config.logLevel !== 'silent' ? { level: config.logLevel } : false,
});

async function start(): Promise<void> {
  await fastify.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  });

  // Security headers. CORP/COEP are disabled because the client is served
  // from a different origin (dev :3000, separate frontend deploy in prod)
  // and Socket.IO polling/XHR would otherwise be blocked in the browser.
  // CSP connect-src explicitly allows the configured client origin + ws(s).
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", ...config.corsOrigins, 'ws:', 'wss:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  await fastify.register(rateLimit, {
    max: config.rateLimitMaxRequests,
    timeWindow: config.rateLimitTimeWindow,
    keyGenerator: (req) => req.ip,
  });

  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

  // ICE servers for WebRTC clients. STUN always; TURN only when fully
  // configured via TURN_URLS + TURN_USERNAME + TURN_PASSWORD.
  fastify.get('/ice-servers', async () => {
    return { iceServers: buildIceServers(config) };
  });

  const httpServer = fastify.server;
  const io = new SocketIOServer<SocketIOServer>(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: config.maxHttpBufferSize,
  });

  setupSocketHandlers(io);

  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`[Server] Running on http://${config.host}:${config.port}`);
    console.log(`[Server] CORS origins: ${config.corsOrigins.join(', ')}`);
    console.log(`[Server] STUN servers: ${config.stunServers.join(', ')}`);
    console.log(`[Server] TURN configured: ${isTurnConfigured(config) ? 'yes' : 'no'}`);
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
}

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  await fastify.close();
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  await fastify.close();
});

start();