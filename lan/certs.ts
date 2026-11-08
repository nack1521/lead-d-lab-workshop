import { existsSync } from 'node:fs';

/**
 * Certificate inspection without unsupported OpenSSL flags. LibreSSL's x509
 * lacks `-ext`, so the Subject Alternative Name block is parsed from `-text`.
 */
function run(command: string[]): { ok: boolean; stdout: string } {
  const result = Bun.spawnSync(command);
  return { ok: result.exitCode === 0, stdout: result.stdout.toString() };
}

export interface CertificateSan {
  dnsNames: string[];
  ipAddresses: string[];
}

export function readCertificateSan(certPath: string): CertificateSan {
  const text = run(['openssl', 'x509', '-in', certPath, '-noout', '-text']).stdout;
  const san: CertificateSan = { dnsNames: [], ipAddresses: [] };
  const block = text.split('X509v3 Subject Alternative Name:')[1]?.split('\n\n')[0] ?? '';
  for (const token of block.split(/[,\n]/).map((value) => value.trim()).filter(Boolean)) {
    if (token.startsWith('IP Address:')) san.ipAddresses.push(token.slice('IP Address:'.length).trim());
    else if (token.startsWith('DNS:')) san.dnsNames.push(token.slice('DNS:'.length).trim());
  }
  return san;
}

/** Exact SAN match only: never substring matching (192.168.1.9 must not match 192.168.1.98). */
export function hasExactSanIp(certPath: string, ip: string): boolean {
  return readCertificateSan(certPath).ipAddresses.includes(ip);
}

export function hasExactSanDns(certPath: string, dnsName: string): boolean {
  return readCertificateSan(certPath).dnsNames.includes(dnsName);
}

export interface LeafExtensions {
  hasAuthorityKeyIdentifier: boolean;
  hasSubjectKeyIdentifier: boolean;
  hasServerAuth: boolean;
  caIsFalse: boolean;
}

/** Strict-compatible TLS leaf checks (OpenSSL >= 3.4 rejects a leaf without AKI). */
export function readLeafExtensions(certPath: string): LeafExtensions {
  const text = run(['openssl', 'x509', '-in', certPath, '-noout', '-text']).stdout;
  return {
    hasAuthorityKeyIdentifier: /X509v3 Authority Key Identifier/.test(text),
    hasSubjectKeyIdentifier: /X509v3 Subject Key Identifier/.test(text),
    hasServerAuth: /TLS Web Server Authentication/.test(text),
    caIsFalse: /CA:FALSE/.test(text),
  };
}

export function isStrictCompatibleLeaf(certPath: string): boolean {
  const extensions = readLeafExtensions(certPath);
  return (
    extensions.hasAuthorityKeyIdentifier &&
    extensions.hasSubjectKeyIdentifier &&
    extensions.hasServerAuth &&
    extensions.caIsFalse
  );
}

export function isSignedBy(certPath: string, caCertPath: string): boolean {
  return run(['openssl', 'verify', '-CAfile', caCertPath, certPath]).ok;
}

export function expiresWithinSeconds(certPath: string, seconds: number): boolean {
  // openssl x509 -checkend exits nonzero when the certificate expires within N seconds.
  return !run(['openssl', 'x509', '-in', certPath, '-noout', '-checkend', String(seconds)]).ok;
}

export interface RenewalPlan {
  reuse: boolean;
  reasons: string[];
}

/**
 * Decide whether the existing leaf can be reused for the exact selected address.
 * Reuse requires: files exist, exact SAN IP, signed by the retained CA, strict
 * compatible extensions, and not expiring within the renewal window.
 */
export function planLeafRenewal(options: {
  certPath: string;
  keyPath: string;
  caCertPath: string;
  ip: string;
  dnsName?: string;
  renewalWindowSeconds?: number;
}): RenewalPlan {
  const reasons: string[] = [];
  if (!existsSync(options.certPath) || !existsSync(options.keyPath)) {
    return { reuse: false, reasons: ['missing certificate or key'] };
  }
  if (!hasExactSanIp(options.certPath, options.ip)) reasons.push('exact SAN IP does not match the selected address');
  if (options.dnsName && !hasExactSanDns(options.certPath, options.dnsName)) {
    reasons.push('mDNS SAN name does not match');
  }
  if (!isSignedBy(options.certPath, options.caCertPath)) reasons.push('leaf is not signed by the retained development CA');
  if (!isStrictCompatibleLeaf(options.certPath)) reasons.push('leaf lacks strict-compatible extensions (AKI/SKI)');
  if (expiresWithinSeconds(options.certPath, options.renewalWindowSeconds ?? 30 * 24 * 60 * 60)) {
    reasons.push('leaf is expired or inside the renewal window');
  }
  return { reuse: reasons.length === 0, reasons };
}
