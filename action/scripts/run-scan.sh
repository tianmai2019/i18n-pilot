#!/usr/bin/env bash
set -euo pipefail

# i18n-pilot GitHub Action: run scan and parse outputs
#
# Environment variables required:
#   INPUT_FORMAT        - sarif | json | compact | stylish
#   INPUT_OUTPUT_FILE   - Optional output file path
#   TARGETS             - Space-separated paths/files to scan (from incremental.sh)
#
# Output to GITHUB_OUTPUT:
#   report-path         - Where the report was written
#   issue-count         - Number of issues (only accurate for format=json)
#

FORMAT="${INPUT_FORMAT:-sarif}"

# Build output path
if [ -n "${INPUT_OUTPUT_FILE:-}" ]; then
  OUTFILE="$INPUT_OUTPUT_FILE"
else
  OUTFILE="i18n-pilot-report.${FORMAT}"
fi

# Ensure output directory exists
OUTDIR=$(dirname "$OUTFILE")
if [ -n "$OUTDIR" ] && [ "$OUTDIR" != "." ]; then
  mkdir -p "$OUTDIR"
fi

echo "report-path=$OUTFILE" >> "$GITHUB_OUTPUT"

# If no targets, skip scan and write empty report
if [ -z "$TARGETS" ]; then
  echo "No JS/TS/Vue files matched; skipping scan"

  if [ "$FORMAT" = "json" ]; then
    echo '{"schemaVersion":"1.0.0","result":{"fileCount":0,"issueCount":0},"issues":[]}' > "$OUTFILE"
    echo "issue-count=0" >> "$GITHUB_OUTPUT"
  elif [ "$FORMAT" = "sarif" ]; then
    echo '{"$schema":"https://schemastore.azureedge.net/schemas/sarif/sarif-2.1.0.json","version":"2.1.0","runs":[{"tool":{"driver":{"name":"i18n-pilot","version":"0.0.0"}},"results":[]}]}' > "$OUTFILE"
    echo "issue-count=0" >> "$GITHUB_OUTPUT"
  else
    echo "No i18n issues found" > "$OUTFILE"
    echo "issue-count=0" >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

echo "Scanning: $TARGETS"
echo "Format: $FORMAT"
echo "Output: $OUTFILE"

# Run scan (continue even if issues found)
# shellcheck disable=SC2086
i18n-pilot scan $TARGETS --format "$FORMAT" > "$OUTFILE" || true

# Parse issue count if JSON format
if [ "$FORMAT" = "json" ]; then
  if command -v node >/dev/null 2>&1; then
    COUNT=$(node -e "const d=JSON.parse(require('fs').readFileSync('$OUTFILE','utf8')); console.log(d.result.issueCount)")
    echo "issue-count=$COUNT" >> "$GITHUB_OUTPUT"
  else
    echo "issue-count=unknown" >> "$GITHUB_OUTPUT"
  fi
else
  echo "issue-count=unknown" >> "$GITHUB_OUTPUT"
fi

echo "Scan complete"
