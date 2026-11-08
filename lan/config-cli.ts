/**
 * Small CLI used by lan/generate-certs.sh and operator checks. Printing is
 * limited to the selected private address / certificate plan (no keys).
 */
import { join } from 'node:path';
import { LanSelectionError, selectLanAddress } from './address.ts';
import { hasExactSanIp, isStrictCompatibleLeaf, planLeafRenewal } from './certs.ts';

const [command, ...args] = process.argv.slice(2);

try {
  if (command === 'address') {
    const selection = selectLanAddress({ explicit: process.env.LAN_BIND ?? process.env.LAN_IP });
    console.log(selection.address);
  } else if (command === 'validate-address') {
    const [ip] = args;
    if (!ip) throw new Error('usage: validate-address <ip>');
    const selection = selectLanAddress({ explicit: ip });
    console.log(JSON.stringify({ address: selection.address, interfaceName: selection.interfaceName }));
  } else if (command === 'cert-plan') {
    const [dir, ip, host] = args;
    if (!dir || !ip) throw new Error('usage: cert-plan <cert-dir> <ip> [mdns-host]');
    const plan = planLeafRenewal({
      certPath: join(dir, 'server.crt'),
      keyPath: join(dir, 'server.key'),
      caCertPath: join(dir, 'ca.crt'),
      ip,
      dnsName: host ? `${host}.local` : undefined,
      renewalWindowSeconds: Number(process.env.LAN_RENEW_WINDOW_SECONDS ?? 30 * 24 * 60 * 60),
    });
    console.log(JSON.stringify(plan));
    process.exit(plan.reuse ? 0 : 1);
  } else if (command === 'check-san') {
    const [certPath, ip] = args;
    if (!certPath || !ip) throw new Error('usage: check-san <cert> <ip>');
    process.exit(hasExactSanIp(certPath, ip) ? 0 : 1);
  } else if (command === 'leaf-strict') {
    const [certPath] = args;
    if (!certPath) throw new Error('usage: leaf-strict <cert>');
    process.exit(isStrictCompatibleLeaf(certPath) ? 0 : 1);
  } else {
    console.error('unknown command; expected address | cert-plan | check-san | leaf-strict');
    process.exit(2);
  }
} catch (error) {
  const label = error instanceof LanSelectionError ? error.code : 'ERROR';
  console.error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}
