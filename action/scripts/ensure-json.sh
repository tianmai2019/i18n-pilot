#!/usr/bin/env bash
set -euo pipefail

# i18n-pilot GitHub Action: ensure a JSON report exists for downstream steps
# (PR comment, threshold check). Reuses the main report if format=json,
# otherwise runs a second scan to produce a JSON side-report.
#
# Environment variables required:
#   INPUT_FORMAT     - the user-selected format
#   REPORT_PATH      - the main report path (from run-scan.sh output)
#   TARGETS          - Space-separated paths/files that were scanned
#
# Output to GITHUB_OUTPUT:
#   json-path        - Path to a JSON report (either the main or a side one)
#

FORMAT="${INPUT_FORMAT:-sarif}"

# If the main format is already JSON, reuse it
if [ "$FORMAT" = "json" ]; then
  echo "json-path=$REPORT_PATH" >> "$GITHUB_OUTPUT"
  echo "Reusing main JSON report: $REPORT_PATH"
  exit 0
fi

# Otherwise write a side JSON report
SIDE_JSON="i18n-pilot-report.json"

if [ -z "$TARGETS" ]; then
  # Empty targets → write empty JSON stub
  echo '{"schemaVersion":"1.0.0","result":{"fileCount":0,"issueCount":0},"issues":[],"summary":{"byRule":{},"bySeverity":{},"byFile":{}}}' > "$SIDE_JSON"
else
  # shellcheck disable=SC2086
  i18n-pilot scan $TARGETS --format json > "$SIDE_JSON" || true
fi

echo "json-path=$SIDE_JSON" >> "$GITHUB_OUTPUT"
echo "Wrote side JSON report: $SIDE_JSON"
