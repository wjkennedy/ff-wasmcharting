#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${FORGE_SITE:-}" ]]; then
  echo "FORGE_SITE is required (example: your-domain.atlassian.net)"
  exit 1
fi

forge deploy -e production
forge install -e production --site="$FORGE_SITE" --product=jira --upgrade
