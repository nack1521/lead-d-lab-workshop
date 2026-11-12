#!/bin/sh
# Local publication-safety audit. Prints only pattern TYPE + COUNT + file paths
# (values are never printed). Pattern-based; not an entropy scanner or guarantee.
set -eu
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

re_private='-----BEGIN [A-Z ]*PRIVATE KEY-----'
re_aws='AKIA[0-9A-Z]{16}'
re_pg_url='postgres(ql)?://[^ :/@]+:[^ @]+@'
re_gh='gh[pousr]_[A-Za-z0-9]{30,}'
re_sk='sk-[A-Za-z0-9]{24,}'
re_jwt='eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}'
re_bearer='Bearer [A-Za-z0-9_-]{30,}'

echo "== scope =="
echo "repo=$ROOT head=$(git rev-parse --short HEAD 2>/dev/null || echo none)"
echo "scanner=pattern-grep"
command -v gitleaks >/dev/null 2>&1 && echo "gitleaks=available-but-not-used" || echo "gitleaks=unavailable"
command -v trufflehog >/dev/null 2>&1 && echo "trufflehog=available-but-not-used" || echo "trufflehog=unavailable"

echo "== tracked working-tree pattern counts (values never printed) =="
for pair in "PRIVATE_KEY_BLOCK:$re_private" "AWS_ACCESS_KEY:$re_aws" "POSTGRES_URL_WITH_PASSWORD:$re_pg_url" "GITHUB_TOKEN:$re_gh" "OPENAI_OR_GENERIC_SK:$re_sk" "JWT_LIKE_LONG:$re_jwt" "BEARER_TOKEN_LITERAL:$re_bearer"; do
  name=${pair%%:*}; re=${pair#*:}
  count=$(git grep -I -E -e "$re" -c -- . 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
  printf '%s=%s\n' "$name" "$count"
  if [ "$count" != "0" ]; then git grep -I -l -E -e "$re" -- . 2>/dev/null | sed 's/^/  path: /'; fi
done

echo "== credential-line classification (placeholder/template vs real-like) =="
TRACKED_TOTAL=$(git grep -I -E -e "$re_pg_url" -- . 2>/dev/null | wc -l | tr -d ' ')
TRACKED_TEMPLATE=$(git grep -I -E -e "$re_pg_url" -- . 2>/dev/null | grep -cE '\$\{|placeholder|REDACTED|example' || true)
printf 'tracked_database_url_total=%s\n' "$TRACKED_TOTAL"
printf 'tracked_database_url_placeholder_or_template=%s\n' "${TRACKED_TEMPLATE:-0}"
printf 'tracked_database_url_real_like_candidates=%s\n' "$((TRACKED_TOTAL - ${TRACKED_TEMPLATE:-0}))"

echo "== full Git history pattern counts =="
for pair in "PRIVATE_KEY_BLOCK:$re_private" "AWS_ACCESS_KEY:$re_aws" "POSTGRES_URL_WITH_PASSWORD:$re_pg_url" "GITHUB_TOKEN:$re_gh" "OPENAI_OR_GENERIC_SK:$re_sk" "JWT_LIKE_LONG:$re_jwt"; do
  name=${pair%%:*}; re=${pair#*:}
  count=$(git log --all -p --no-color 2>/dev/null | grep -cE -e "$re" || true)
  printf '%s=%s\n' "$name" "${count:-0}"
done
HIST_TOTAL=$(git log --all -p --no-color 2>/dev/null | grep -E -e "$re_pg_url" | wc -l | tr -d ' ')
HIST_TEMPLATE=$(git log --all -p --no-color 2>/dev/null | grep -E -e "$re_pg_url" | grep -cE '\$\{|placeholder|REDACTED|example' || true)
printf 'history_database_url_total=%s\n' "$HIST_TOTAL"
printf 'history_database_url_placeholder_or_template=%s\n' "${HIST_TEMPLATE:-0}"
printf 'history_database_url_real_like_candidates=%s\n' "$((HIST_TOTAL - ${HIST_TEMPLATE:-0}))"

echo "== tracked/committed environment or private-key files =="
git ls-files | grep -E '(^|/)\.env|\.pem$|\.key$|id_rsa|\.p12$|\.pfx$|\.local/' || echo "none tracked"

echo "== files ever added to history matching env/private patterns =="
git log --all --diff-filter=A --name-only --pretty=format: 2>/dev/null | sort -u | grep -E '(^|/)\.env|\.pem$|\.key$|id_rsa|\.p12$|\.pfx$|\.local/' || echo "none in history"

echo "== publication ignore coverage =="
for path in .env .env.mode-b .local/fixtures.json .local/lan-certs/server.key .local/hr-grants/example.json; do
  if git check-ignore -q "$path"; then echo "ignored: $path"; else echo "NOT_IGNORED: $path"; fi
done
for entry in '.env' '.local' '.git' 'node_modules' 'docs'; do
  grep -qx "$entry" .dockerignore 2>/dev/null && echo "dockerignore_excludes: $entry" || echo "dockerignore_missing: $entry"
done

echo "== public candidate build pattern scan =="
if [ -d apps/web/dist/assets ]; then
  echo "loopback_refs=$(grep -o '127\.0\.0\.1' apps/web/dist/assets/*.js 2>/dev/null | wc -l | tr -d ' ')"
  echo "private_ip_refs=$(grep -oE '192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+' apps/web/dist/assets/*.js 2>/dev/null | wc -l | tr -d ' ')"
  echo "postgres_url_refs=$(grep -o 'postgres://' apps/web/dist/assets/*.js 2>/dev/null | wc -l | tr -d ' ')"
else
  echo "public candidate dist missing; build the public candidate first"
fi
echo "== limits =="
echo "pattern-based only; no entropy analysis; history scan excludes binary/PDF internals; no push or external secret service used"
