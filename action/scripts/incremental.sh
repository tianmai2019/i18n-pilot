#!/usr/bin/env bash
set -euo pipefail

# i18n-pilot GitHub Action: incremental scan target resolution
#
# Environment variables required:
#   INPUT_PATH         - Base path to scan (default: .)
#   INPUT_INCREMENTAL  - auto | full (default: auto)
#   BASE_SHA           - PR base commit sha (e.g., github.event.pull_request.base.sha)
#   HEAD_SHA           - PR head commit sha (e.g., github.sha)
#   EVENT_NAME         - github.event_name
#
# Output to GITHUB_OUTPUT:
#   paths              - Space-separated file/path targets to scan
#

# File extensions to consider (i18n-pilot CLI will ignore non-matching anyway)
FILE_EXTS='\.(js|jsx|ts|tsx|vue)$'

# Normalize inputs
INPUT_PATH="${INPUT_PATH:-.}"
INPUT_INCREMENTAL="${INPUT_INCREMENTAL:-auto}"

# Decide scan targets
if [ "$EVENT_NAME" = "pull_request" ] && [ "$INPUT_INCREMENTAL" != "full" ] && [ -n "$BASE_SHA" ]; then
  # PR mode with incremental: diff against base

  # Ensure base commit is available (actions/checkout with fetch-depth: 0 is required)
  if ! git cat-file -t "$BASE_SHA" >/dev/null 2>&1; then
    # Try fetching if not present
    git fetch origin "$BASE_SHA" --depth=1 2>/dev/null || true
  fi

  # Changed files in PR (Added or Modified only)
  CHANGED=$(git diff --name-only --diff-filter=AM "$BASE_SHA" "$HEAD_SHA" 2>/dev/null | grep -E "$FILE_EXTS" || true)

  if [ -n "$CHANGED" ]; then
    # Filter files under INPUT_PATH if it's not workspace root
    if [ "$INPUT_PATH" != "." ] && [ -n "$INPUT_PATH" ]; then
      # Path prefix match
      CHANGED=$(echo "$CHANGED" | grep "^${INPUT_PATH#./}" || true)
    fi
  fi

  # Trim trailing space
  PATHS=$(echo "$CHANGED" | tr '\n' ' ' | sed 's/[[:space:]]*$//')

  # If nothing matched (e.g. only markdown changes), paths will be empty
  # Caller must handle empty paths (skip scan)
else
  # Push / workflow_dispatch / incremental=full → scan the whole path
  PATHS="$INPUT_PATH"
fi

echo "paths=$PATHS" >> "$GITHUB_OUTPUT"

# Also echo for action logs (useful for debugging)
echo "Scan targets: $PATHS"
