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
| `fail-on` | `error` | Severity that fails the job: `error` \| `warning` \| `never`. See "Threshold gate" below. |
| `threshold` | `0` | Max number of qualifying issues allowed. `0` means any qualifying issue fails the job. |
| `output-file` | auto-generated | Custom path for the report file |
| `comment-on-pr` | `true` | Post (or update) a Markdown comment on the PR. Requires `pull-requests: write`. |
| `github-token` | `${{ github.token }}` | Token used to post the PR comment |

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

### 4. Warning-only mode (never fail)

```yaml
- uses: tianmai2019/i18n-pilot/action@v0.2
  with:
    fail-on: 'never'
```

### 5. Fail the job if there are more than 20 issues

```yaml
- uses: tianmai2019/i18n-pilot/action@v0.2
  with:
    fail-on: 'error'
    threshold: 20
```

## Threshold gate

| `fail-on` | Counts | Behaviour |
|-----------|--------|-----------|
| `error` (default) | Only `error`-severity issues | Fails the job if `count(error) > threshold` |
| `warning` | Both `error` and `warning` | Fails the job if `count(error+warning) > threshold` |
| `never` | Nothing | The job never fails; scan is advisory only |

`threshold=0` (default) means **any** qualifying issue fails the job.
Set a higher threshold to allow legacy debt while still gating regressions.

## How it works

1. **Pull request events**: Runs `git diff base..head` to find changed `.js/.jsx/.ts/.tsx/.vue` files and scans only those (faster)
2. **Push / workflow_dispatch**: Scans the full `path`
3. Outputs SARIF format by default which integrates with GitHub Code Scanning UI
4. **PR comment**: On PR events, a Markdown summary is posted to the PR (updated on re-runs, not duplicated). Uses a hidden HTML marker to find the previous comment. Requires `pull-requests: write` permission.

### PR comment example

> ⚠️ Found **3** i18n issues in **2** files.
>
> **By severity** — 🔴 error: 2, 🟡 warning: 1
> **By rule** — `jsx-text`: 2, `string-literals`: 1
> **Top files** — `src/App.tsx` (2), `src/utils.ts` (1)
>
> <details><summary>First 3 issues</summary>
>
> - `jsx-text` — `src/App.tsx:12` — `你好世界`
> - `jsx-text` — `src/App.tsx:20` — `按钮`
> - `string-literals` — `src/utils.ts:8` — `错误消息`
>
> </details>

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
