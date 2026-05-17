#!/usr/bin/env bash
set -o errexit

npm install

API_URL="${REACT_APP_API_URL:-}"
if [ -n "$API_URL" ] && [ "${API_URL%/api}" = "$API_URL" ]; then
  export REACT_APP_API_URL="${API_URL%/}/api"
fi
if [ -n "$REACT_APP_API_URL" ]; then
  export REACT_APP_MEDIA_URL="${REACT_APP_MEDIA_URL:-${REACT_APP_API_URL%/api}}"
fi

npm run build
