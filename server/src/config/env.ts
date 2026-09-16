// ©️ Mewn

export interface ServerConfig {
  nodeEnv: string;
  port: number;
  host: string;
  corsOrigins: string[];
  logLevel: string;
  roomLimitPerIp: number;
  roomExpirySeconds: number;
  maxParticipants: number;
  stunServers: string[];
  rateLimitMaxRequests: number;
  rateLimitTimeWindow: number;
  maxHttpBufferSize: number;
  turnUrls?: string;
  turnUsername?: string;
  turnPassword?: string;
}

function getEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  return parsed;
}

export const config: ServerConfig = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 8080),
  host: getEnv('HOST', 'localhost'),
  corsOrigins: getEnv('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0),
  logLevel: getEnv('LOG_LEVEL', 'debug'),
  roomLimitPerIp: getEnvNumber('ROOM_LIMIT_PER_IP', 10),
  roomExpirySeconds: getEnvNumber('ROOM_EXPIRY_SECONDS', 3600),
  maxParticipants: getEnvNumber('MAX_PARTICIPANTS', 2),
  stunServers: getEnv('STUN_SERVERS', 'stun:stun.l.google.com:19302')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0),
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  rateLimitTimeWindow: getEnvNumber('RATE_LIMIT_TIME_WINDOW', 60000),
  // Must exceed the largest accepted payload (5MB composed image + overhead),
  // or Socket.IO drops the connection mid-capture.
  maxHttpBufferSize: getEnvNumber('MAX_HTTP_BUFFER_SIZE', 6_000_000),
  turnUrls: getEnv('TURN_URLS', ''),
  turnUsername: getEnv('TURN_USERNAME', ''),
  turnPassword: getEnv('TURN_PASSWORD', ''),
};