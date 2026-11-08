#!/bin/sh
# Project-local development CA + server certificate for the private-LAN iPhone
# test mode. Keys stay under ignored .local/lan-certs (mode 600); only the CA
# certificate is public and may be transferred to a test device.
#
# Fail-closed address selection and exact-SAN reuse/renewal are delegated to
# lan/config-cli.ts so the issuer and listener use the same rule set.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CERT_DIR="${LAN_CERT_DIR:-$ROOT/.local/lan-certs}"
LAN_IP="${LAN_IP:-$(cd "$ROOT" && bun run lan/config-cli.ts address)}"
LOCAL_HOST="${LAN_HOSTNAME:-$(scutil --get LocalHostName 2>/dev/null || true)}"
CERT_DAYS="${LAN_CERT_DAYS:-397}"
FORCE="${LAN_CERTS_FORCE:-0}"

mkdir -p "$CERT_DIR"
chmod 700 "$CERT_DIR"

CA_KEY="$CERT_DIR/ca.key"
CA_CRT="$CERT_DIR/ca.crt"
SRV_KEY="$CERT_DIR/server.key"
SRV_CRT="$CERT_DIR/server.crt"

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
authorityKeyIdentifier = keyid:always,issuer
CONF
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$CA_KEY" -out "$CA_CRT" -days 825 -config "$CERT_DIR/ca.cnf" >/dev/null 2>&1
  echo "created development CA: $CA_CRT"
else
  echo "retaining existing development CA identity: $CA_CRT"
fi

need_server=1
if [ "$FORCE" != "1" ] && [ -f "$SRV_CRT" ] && [ -f "$SRV_KEY" ]; then
  if (cd "$ROOT" && bun run lan/config-cli.ts cert-plan "$CERT_DIR" "$LAN_IP" "$LOCAL_HOST" >/dev/null 2>&1); then
    need_server=0
    echo "reusing existing leaf for exact SAN $LAN_IP"
  fi
fi

if [ "$need_server" = "1" ]; then
  SAN="subjectAltName=IP:$LAN_IP"
  if [ -n "$LOCAL_HOST" ]; then
    SAN="$SAN,DNS:$LOCAL_HOST.local"
  fi
  cat >"$CERT_DIR/san.ext" <<CONF
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
$SAN
CONF
  openssl req -new -newkey rsa:2048 -nodes -keyout "$SRV_KEY" \
    -out "$CERT_DIR/server.csr" -subj "/CN=$LAN_IP/O=Lead+D Lab local device testing" >/dev/null 2>&1
  openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CA_CRT" -CAkey "$CA_KEY" \
    -CAserial "$CERT_DIR/ca.srl" -CAcreateserial -out "$SRV_CRT" \
    -days "$CERT_DAYS" -extfile "$CERT_DIR/san.ext" >/dev/null 2>&1
  rm -f "$CERT_DIR/server.csr"
  echo "created server certificate for $LAN_IP${LOCAL_HOST:+ and $LOCAL_HOST.local}: $SRV_CRT"
fi

chmod 600 "$CA_KEY" "$SRV_KEY"
chmod 644 "$CA_CRT" "$SRV_CRT"
rm -f "$CERT_DIR/ca.cnf" "$CERT_DIR/san.ext" "$CERT_DIR/ca.srl" "$ROOT/.srl"

# Fail closed if the exact selected address is not covered or the leaf is not
# standards-compatible; the listener performs the same exact-SAN check.
(cd "$ROOT" && bun run lan/config-cli.ts check-san "$SRV_CRT" "$LAN_IP") || {
  echo "error: leaf SAN does not exactly cover $LAN_IP" >&2
  exit 2
}
(cd "$ROOT" && bun run lan/config-cli.ts leaf-strict "$SRV_CRT") || {
  echo "error: leaf lacks strict-compatible TLS extensions" >&2
  exit 2
}
IFS= read -r SAN_PREVIEW <<EOF
$(openssl x509 -in "$SRV_CRT" -noout -text 2>/dev/null | sed -n '/X509v3 Subject Alternative Name/{n;s/^ *//;p;}')
EOF

echo "LAN IP: $LAN_IP${LOCAL_HOST:+ (mDNS: $LOCAL_HOST.local)}"
echo "leaf SAN: $SAN_PREVIEW"
echo "public CA certificate (safe to transfer to the test iPhone): $CA_CRT"
echo "server certificate: $SRV_CRT"
echo "private keys stay in $CERT_DIR (ignored, mode 600); never transfer or commit them"
