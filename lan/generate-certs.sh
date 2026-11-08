#!/bin/sh
# Project-local development CA + server certificate for the private-LAN iPhone
# test mode. Keys stay under ignored .local/lan-certs (mode 600); only the CA
# certificate is public and may be transferred to a test device.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
LAN_IP="${LAN_IP:-$(ipconfig getifaddr en0 2>/dev/null || true)}"
if [ -z "$LAN_IP" ]; then
  echo "error: LAN IP not detected; pass LAN_IP=<private-lan-ip>" >&2
  exit 2
fi
LOCAL_HOST="${LAN_HOSTNAME:-$(scutil --get LocalHostName 2>/dev/null || true)}"
CERT_DIR="${LAN_CERT_DIR:-$ROOT/.local/lan-certs}"
mkdir -p "$CERT_DIR"
chmod 700 "$CERT_DIR"

CA_KEY="$CERT_DIR/ca.key"
CA_CRT="$CERT_DIR/ca.crt"
SRV_KEY="$CERT_DIR/server.key"
SRV_CRT="$CERT_DIR/server.crt"
FORCE="${LAN_CERTS_FORCE:-0}"

if [ ! -f "$CA_KEY" ] || [ ! -f "$CA_CRT" ]; then
  cat >"$CERT_DIR/ca.cnf" <<'CONF'
[req]
distinguished_name = dn
x509_extensions = v3_ca
prompt = no
[dn]
CN = Lead+D Lab LAN Development CA
O = Lead+D Lab local device testing
[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
CONF
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$CA_KEY" -out "$CA_CRT" -days 825 -config "$CERT_DIR/ca.cnf" >/dev/null 2>&1
  echo "created development CA: $CA_CRT"
fi

need_server=1
if [ "$FORCE" != "1" ] && [ -f "$SRV_CRT" ]; then
  if openssl x509 -in "$SRV_CRT" -noout -ext subjectAltName 2>/dev/null | grep -q "IP Address:$LAN_IP"; then
    need_server=0
  fi
fi

if [ "$need_server" = "1" ]; then
  SAN="subjectAltName=IP:$LAN_IP"
  if [ -n "$LOCAL_HOST" ]; then
    SAN="$SAN,DNS:$LOCAL_HOST.local"
  fi
  cat >"$CERT_DIR/san.ext" <<CONF
basicConstraints = CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
$SAN
CONF
  openssl req -new -newkey rsa:2048 -nodes -keyout "$SRV_KEY" \
    -out "$CERT_DIR/server.csr" -subj "/CN=$LAN_IP/O=Lead+D Lab local device testing" >/dev/null 2>&1
  openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CA_CRT" -CAkey "$CA_KEY" \
    -CAserial "$CERT_DIR/ca.srl" -CAcreateserial -out "$SRV_CRT" -days 397 \
    -extfile "$CERT_DIR/san.ext" >/dev/null 2>&1
  rm -f "$CERT_DIR/server.csr"
  echo "created server certificate for $LAN_IP${LOCAL_HOST:+ and $LOCAL_HOST.local}: $SRV_CRT"
fi

chmod 600 "$CA_KEY" "$SRV_KEY"
chmod 644 "$CA_CRT" "$SRV_CRT"
rm -f "$CERT_DIR/ca.cnf" "$CERT_DIR/san.ext" "$CERT_DIR/ca.srl" "$ROOT/.srl"

echo "LAN IP: $LAN_IP${LOCAL_HOST:+ (mDNS: $LOCAL_HOST.local)}"
echo "public CA certificate (safe to transfer to the test iPhone): $CA_CRT"
echo "server certificate: $SRV_CRT"
echo "private keys stay in $CERT_DIR (ignored, mode 600); never transfer or commit them"
