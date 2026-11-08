import { networkInterfaces, type NetworkInterfaceInfo } from 'node:os';

export class LanSelectionError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'LanSelectionError';
  }
}

const FORBIDDEN_INTERFACE_PREFIXES = [
  'utun',
  'tun',
  'tap',
  'ppp',
  'ipsec',
  'gif',
  'stf',
  'awdl',
  'llw',
  'bridge',
  'ap',
  'nan',
  'vnic',
];

export function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function isForbiddenInterfaceName(name: string): boolean {
  return FORBIDDEN_INTERFACE_PREFIXES.some((prefix) => name.toLowerCase().startsWith(prefix));
}

export interface LanSelection {
  address: string;
  interfaceName: string;
}

export interface SelectLanOptions {
  explicit?: string;
  interfaces?: NodeJS.Dict<NetworkInterfaceInfo[]>;
  /** Tests only: allow a loopback bind so the entry can be exercised locally. */
  allowLoopbackForTest?: boolean;
}

function interfaceEntries(interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>) {
  const entries: { name: string; info: NetworkInterfaceInfo }[] = [];
  for (const [name, infos] of Object.entries(interfaces)) {
    for (const info of infos ?? []) entries.push({ name, info });
  }
  return entries;
}

/**
 * Select exactly one intended private LAN IPv4 address. Fails closed for
 * explicit public/wildcard/loopback/VPN/missing addresses and for ambiguous or
 * absent automatic candidates; it never silently picks an unsafe interface.
 */
export function selectLanAddress(options: SelectLanOptions = {}): LanSelection {
  const interfaces = options.interfaces ?? networkInterfaces();
  const entries = interfaceEntries(interfaces).filter(
    ({ info }) => info.family === 'IPv4' || (info.family as unknown) === 4,
  );

  if (options.explicit) {
    const explicit = options.explicit.trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(explicit)) {
      throw new LanSelectionError('INVALID_ADDRESS', `LAN_BIND "${explicit}" is not an IPv4 address`);
    }
    if (explicit === '0.0.0.0' || explicit === '255.255.255.255') {
      throw new LanSelectionError('WILDCARD_ADDRESS', 'refusing a wildcard LAN bind address');
    }
    const entry = entries.find(({ info }) => info.address === explicit);
    if (!entry) {
      throw new LanSelectionError('ADDRESS_NOT_ON_INTERFACE', `LAN_BIND ${explicit} is not on a local interface`);
    }
    if (entry.info.internal) {
      if (!options.allowLoopbackForTest) {
        throw new LanSelectionError('LOOPBACK_ADDRESS', 'refusing a loopback address as the LAN entry');
      }
      return { address: explicit, interfaceName: entry.name };
    }
    if (isForbiddenInterfaceName(entry.name)) {
      throw new LanSelectionError('VPN_OR_VIRTUAL_INTERFACE', `interface ${entry.name} is not a private LAN interface`);
    }
    if (!isPrivateIpv4(explicit)) {
      throw new LanSelectionError('PUBLIC_ADDRESS', `LAN_BIND ${explicit} is not a private IPv4 address`);
    }
    return { address: explicit, interfaceName: entry.name };
  }

  const candidates = new Map<string, string>();
  for (const { name, info } of entries) {
    if (info.internal || isForbiddenInterfaceName(name) || !isPrivateIpv4(info.address)) continue;
    candidates.set(info.address, name);
  }
  if (candidates.size === 0) {
    throw new LanSelectionError(
      'NO_PRIVATE_INTERFACE',
      'no private LAN IPv4 interface found; set LAN_BIND to the intended private address',
    );
  }
  if (candidates.size > 1) {
    const list = [...candidates].map(([address, name]) => `${name}=${address}`).join(', ');
    throw new LanSelectionError(
      'AMBIGUOUS_INTERFACE',
      `multiple private LAN candidates (${list}); set LAN_BIND explicitly to the intended address`,
    );
  }
  const [[address, interfaceName]] = [...candidates];
  return { address, interfaceName };
}
