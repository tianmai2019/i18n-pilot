# i18n-pilot GitHub Action

> i18n quality gate for your CI pipeline — detect hardcoded Chinese text before it reaches production.

## Usage

```yaml
# .github/workflows/i18n.yml
name: i18n Quality Gate
on: [pull_request, push]
jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      security-events: write  # For SARIF upload
      pull-requests: write    # For PR comments (future feature)
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0        # Required for incremental PR scanning

      - uses: tianmai2019/i18n-pilot/action@v0.2
        with:
          path: './src'          # Default: .
          format: 'sarif'        # Default: sarif (json / compact / stylish)
          incremental: 'auto'    # auto=PR incremental, push full

      # Optional: Upload SARIF to GitHub Code Scanning
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: i18n-pilot-report.sarif
```

## Inputs

| Name | Default | Description |
|------|---------|-------------|
| `path` | `.` | Path to scan (relative to workspace root) |
| `format` | `sarif` | Output format: sarif (recommended for GitHub), json, compact, stylish |
| `version` | `latest` | Specific i18n-pilot npm version pin |
| `incremental` | `auto` | `auto` scans only changed files on PR; `full` always scans all files |
| `output-file` | auto-generated | Custom path for the report file |

## Outputs

| Name | Description |
|------|-------------|
| `report-path` | Path to the generated report file |
| `issue-count` | Number of issues found (only accurate for format=json) |
| `scanned-paths` | Space-separated list of files/paths that were scanned |

## Examples

### 1. Full scan on push, incremental on PR

```yaml
- uses: tianmai2019/i18n-pilot/action@v0.2
  with:
    path: './frontend'
    format: 'json'
```

### 2. Full scan always (no incremental)

```yaml
- uses: tianmai2019/i18n-pilot/action@v0.2
  with:
    incremental: 'full'
```

### 3. With custom output path

```yaml
- uses: tianmai2019/i18n-pilot/action@v0.2
  with:
    output-file: './artifacts/i18n-report.sarif'
```

## How it works

1. **Pull request events**: Runs `git diff base..head` to find changed `.js/.jsx/.ts/.tsx/.vue` files and scans only those (faster)
2. **Push / workflow_dispatch**: Scans the full `path`
3. Outputs SARIF format by default which integrates with GitHub Code Scanning UI

## Requirements

- Node.js 20+ (automatically set up by the action)
- For incremental scan: `actions/checkout@v4` with `fetch-depth: 0`

## Limitations

- 📌 This is a **quality gate scanner**, not an automated translation tool
- 📌 Only detects hardcoded Chinese text (English hardcoded text is intentional)
- 📌 Works best with React/TS/JSX/Vue projects
- 📌 Rule config (`.i18nrc.json`) is not yet configurable via this action (coming soon)

## License

MIT — see the [top-level LICENSE](../LICENSE) for details.
