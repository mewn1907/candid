// ©️ Mewn

import { ServerConfig } from './config';

export interface IceServerEntry {
  urls: string | string[];
  username?: string;
  credential?: string;
}

type IceConfig = Pick<ServerConfig, 'stunServers' | 'turnUrls' | 'turnUsername' | 'turnPassword'>;

// Builds the RTCIceServer list served to clients. STUN is always included;
// TURN is included only when URLs *and* credentials are all configured,
// so partially-set TURN env never leaks half-configured entries.
export function buildIceServers(config: IceConfig): IceServerEntry[] {
  const servers: IceServerEntry[] = [];
  if (config.stunServers.length > 0) {
    servers.push({ urls: [...config.stunServers] });
  }
  const turnUrls = (config.turnUrls ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (turnUrls.length > 0 && config.turnUsername && config.turnPassword) {
    servers.push({
      urls: turnUrls,
      username: config.turnUsername,
      credential: config.turnPassword,
    });
  }
  return servers;
}

export function isTurnConfigured(config: IceConfig): boolean {
  return buildIceServers(config).some((s) => s.username !== undefined);
}
