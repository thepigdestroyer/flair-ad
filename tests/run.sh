#!/usr/bin/env bash
# Convenience wrapper: runs Playwright with the libasound shim on LD_LIBRARY_PATH
# and points BASE_URL at the local static server.
set -euo pipefail
cd "$(dirname "$0")"
export LD_LIBRARY_PATH="/home/mj/.local/lib-playwright/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
export BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
exec npx playwright test "$@"
