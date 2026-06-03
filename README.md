# i18n-pilot

English | [简体中文](./README.zh-CN.md)

> I18n quality gate and debt scanner for modern frontend projects.

![i18n-pilot logo](./assets/logo.svg)

## Overview

`i18n-pilot` is an early-stage CLI tool that helps teams find internationalization debt before it reaches production.

It does not try to be another one-off AI translation tool. Instead, the first version focuses on detection: scanning source code, finding hardcoded user-facing text, and reporting where your project still needs i18n work.

The long-term goal is to become a lightweight i18n quality gate for modern frontend teams: CLI first, then CI checks, pull request reports, historical trends, and project-level i18n memory.

## Why This Exists

AI editors can translate a string once. They usually do not continuously answer questions like:

- Did this pull request introduce new hardcoded user-facing text?
- Which files have the highest i18n debt?
- Is our i18n debt getting better or worse over time?
- Which strings are already handled by `t()`, `$t()`, or `formatMessage()`?
- Can CI block regressions before they reach production?

`i18n-pilot` focuses on these engineering governance problems.

## What It Does Today

The current MVP can:

- Scan a project directory from the command line
- Detect hardcoded Chinese strings in JavaScript / TypeScript / JSX / TSX files
- Detect Chinese text in JSX text nodes
- Skip common generated or dependency folders such as `node_modules`, `.git`, `dist`, and `backup`
- Print a grouped terminal report with file names, line numbers, and rule messages

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

### Scan the Example Project

```bash
node dist/index.js scan examples
```

Example output:

```text
🔍 i18n-pilot scan
   Scanning: examples

Scan Results:
────────────────────────────────────────────────────────────
  Files scanned:  1
  Issues found:   8
────────────────────────────────────────────────────────────
```

### Future npm Usage

After the package is published, the target usage is:

```bash
npx i18n-pilot scan ./src
```

## Project Structure

```text
code/
├── src/
│   ├── cli.ts                         # CLI command definitions
│   ├── index.ts                       # CLI runtime entry
│   ├── scanner.ts                     # File traversal and rule execution
│   ├── rules/
│   │   └── hardcoded-chinese.ts       # First i18n debt detection rule
│   └── types/
│       └── index.ts                   # Rule, issue, and scan result types
├── backup/                            # Previous translation demo references
├── examples/
│   └── TestComponent.jsx
├── assets/
│   └── logo.svg
├── package.json
└── tsconfig.json
```

## Roadmap

### Phase 1: Core CLI

- [x] Add `scan` command
- [x] Add first rule: hardcoded Chinese detection
- [ ] Detect JSX attributes and template literals more accurately
- [ ] Ignore already-internationalized strings such as `t('key')` and `$t('key')`
- [ ] Add `.i18nignore` support
- [ ] Add JSON output for CI integration
- [ ] Publish v0.1.0 to npm

### Phase 2: CI and Project Memory

- [ ] Add `check` command for CI quality gates
- [ ] Add GitHub Action support
- [ ] Store local scan history under `.i18n-pilot/`
- [ ] Add `history` and `diff` commands

### Phase 3: Multi-framework and Health Score

- [ ] Support Vue and Next.js projects
- [ ] Validate locale files
- [ ] Add an i18n health score
- [ ] Support community rules

## Positioning

`i18n-pilot` is not a replacement for i18next, vue-i18n, FormatJS, Crowdin, or Lokalise.

It is designed to sit before and around them as a quality gate:

```text
source code → i18n-pilot scan/check → i18n framework / TMS / CI
```

## License

MIT
