#!/usr/bin/env bash
set -euo pipefail

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Install Cloudflare's tunnel tool first:"
  echo "  brew install cloudflared"
  exit 1
fi

if [[ ! -f deploy/cloudflared.yml ]]; then
  echo "No deploy/cloudflared.yml yet. In order:"
  echo "  1. brew install cloudflared"
  echo "  2. cloudflared tunnel login"
  echo "  3. cloudflared tunnel create teacherconnect"
  echo "  4. Copy deploy/cloudflared.yml.example to deploy/cloudflared.yml"
  echo "  5. Put the tunnel UUID in that file (cloudflared tunnel list)"
  echo "  6. cloudflared tunnel route dns teacherconnect bookwithly.com"
  echo "  7. cloudflared tunnel route dns teacherconnect www.bookwithly.com"
  echo "  8. pnpm docker:app   (or keep it running)"
  echo "  9. ./scripts/start-tunnel.sh"
  exit 1
fi

exec cloudflared tunnel --config deploy/cloudflared.yml run
