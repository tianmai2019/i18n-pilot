# i18n-pilot

English | [简体中文](./README.zh-CN.md)

> I18n quality gate and debt scanner for modern frontend projects.

![i18n-pilot logo](./assets/logo.svg)

## Overview

`i18n-pilot` is a CLI tool that helps teams find internationalization debt before it reaches production.

It does not try to be another one-off AI translation tool. Instead, it focuses on detection: scanning source code, finding hardcoded user-facing text, and reporting where your project still needs i18n work.

The goal is to become a lightweight i18n quality gate for modern frontend teams: CLI first, then CI checks, pull request reports, historical trends, and project-level i18n memory.

## What It Does

- Scan a project directory from the command line
- Detect hardcoded Chinese strings in JavaScript / TypeScript / JSX / TSX files
- Detect Chinese text in JSX text nodes and attributes
- Skip common generated or dependency folders such as `node_modules`, `.git`, `dist`, `build`
- Support 5 output formats: stylish, compact, JSON, HTML, and SARIF
- Support configuration via `.i18nrc.json` and `.i18nignore`
- Built-in presets: recommended, strict, minimal
- GitHub Actions integration with SARIF upload to GitHub Advanced Security
- Generate beautiful interactive HTML reports

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
cd code
npm install
```

### Build the CLI

```bash
npm run build
```

### Initialize Configuration (Optional)

```bash
node dist/index.js init --preset recommended
```

This creates:
- `.i18nrc.json` - Configuration file
- `.i18nignore` - Files and directories to ignore

### Scan Your Project

```bash
# Basic scan (stylish format)
node dist/index.js scan ./src

# Scan with different output formats
node dist/index.js scan ./src --format compact
node dist/index.js scan ./src --format json > report.json
node dist/index.js scan ./src --format html > report.html
node dist/index.js scan ./src --format sarif > report.sarif

# Use a preset
node dist/index.js scan ./src --preset strict

# List available presets
node dist/index.js presets
```

## Commands

### `scan [path]`

Scan a directory for i18n issues.

Options:
- `--no-i18nignore` - Disable `.i18nignore` support
- `--ext <extensions...>` - File extensions to scan (default: js, jsx, ts, tsx)
- `--ignore <patterns...>` - Additional glob patterns to ignore
- `--format <format>` - Output format: stylish, compact, json, html, sarif (default: stylish)
- `--rule <rules...>` - Rule config entries (e.g., jsx-text=off)
- `--whitelist <strings...>` - Exact strings to ignore
- `--preset <preset>` - Use a preset configuration (recommended, strict, minimal)
- `--config <path>` - Path to config file (not implemented yet)
- `--no-config` - Disable config file loading

### `init`

Initialize i18n-pilot configuration.

Options:
- `--preset <preset>` - Use a preset configuration (default: recommended)
- `--force` - Overwrite existing configuration file

### `presets`

List available presets.

## Configuration

### `.i18nrc.json`

```json
{
  "extends": "recommended",
  "rules": {
    "jsx-text": "error",
    "jsx-attributes": "warn",
    "string-literals": "info",
    "template-literals": "info"
  },
  "ignore": ["node_modules/**", "dist/**", "build/**"],
  "whitelist": ["一些默认文案"],
  "settings": {
    "i18nCallees": ["t", "$t", "i18n.t"]
  }
}
```

### `.i18nignore`

```
node_modules
dist
build
coverage
.git
.next
.cache
*.min.js
*.log
```

## Presets

| Preset | Description |
|--------|-------------|
| `recommended` | JSX text as error, string literals as info |
| `strict` | All rules as error |
| `minimal` | Only critical issues as error |

## Output Formats

### `stylish` (default)

Beautiful, human-readable terminal output with statistics.

### `compact`

Compact, machine-readable format similar to ESLint's compact format.

### `json`

Full structured JSON data for custom integrations.

### `html`

Beautiful, interactive HTML report with collapsible sections.

### `sarif`

SARIF 2.1.0 format for GitHub Advanced Security integration.

## CI Integration

### GitHub Actions

Create `.github/workflows/i18n-pilot.yml`:

```yaml
name: i18n-pilot

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:

jobs:
  i18n-pilot:
    name: i18n-pilot Check
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: node dist/index.js scan ./src --format sarif > report.sarif
        continue-on-error: true

      - name: Upload SARIF report
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: report.sarif
          category: i18n-pilot

      - name: Fail if issues found
        run: node dist/index.js scan ./src
```

See [CI_SETUP.md](./CI_SETUP.md) for full documentation including GitLab CI examples.

## Rules

| Rule | Description |
|------|-------------|
| `jsx-text` | Hardcoded Chinese in JSX text nodes |
| `jsx-attributes` | Hardcoded Chinese in JSX attributes |
| `string-literals` | Hardcoded Chinese in string literals |
| `template-literals` | Hardcoded Chinese in template literals |

## Project Structure

```text
code/
├── src/
│   ├── cli.ts                         # CLI command definitions
│   ├── index.ts                       # CLI runtime entry
│   ├── scanner.ts                     # File traversal and rule execution
│   ├── rules/
│   │   ├── index.ts                   # Rule registry
│   │   ├── jsx-text.ts                # JSX text rule
│   │   ├── jsx-attributes.ts          # JSX attributes rule
│   │   ├── string-literals.ts         # String literals rule
│   │   └── template-literals.ts       # Template literals rule
│   ├── formatters/
│   │   ├── index.ts                   # Formatter registry
│   │   ├── stylish.ts                 # Stylish output
│   │   ├── compact.ts                 # Compact output
│   │   ├── json.ts                    # JSON output
│   │   ├── html.ts                    # HTML report
│   │   └── sarif.ts                   # SARIF output
│   ├── config/
│   │   ├── index.ts                   # Config loader
│   │   └── presets.ts                 # Built-in presets
│   ├── types/
│   │   └── index.ts                   # Type definitions
│   └── utils/
│       └── cli/validation.ts          # CLI validation utilities
├── examples/
│   └── TestComponent.jsx
├── .github/
│   └── workflows/
│       └── i18n-pilot.yml             # GitHub Actions workflow
├── CI_SETUP.md                        # CI integration guide
├── package.json
└── tsconfig.json
```

## Roadmap

- [ ] Publish v0.1.0 to npm
- [ ] VS Code extension
- [ ] Project memory and history tracking
- [ ] Vue support
- [ ] Locale file validation
- [ ] i18n health score

## Positioning

`i18n-pilot` is not a replacement for i18next, vue-i18n, FormatJS, Crowdin, or Lokalise.

It is designed to sit before and around them as a quality gate:

```text
source code → i18n-pilot scan/check → i18n framework / TMS / CI
```

## License

MIT
