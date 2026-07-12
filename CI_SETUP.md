# i18n-pilot CI Setup

## GitHub Actions

Quick setup for GitHub Actions integration.

### Basic Setup (Recommended)

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

      - name: Run i18n-pilot
        run: node dist/index.js scan ./src
```

### Full Setup (with SARIF and reports)

See `.github/workflows/i18n-pilot.yml` for full setup with:

- HTML report artifact
- JSON report artifact
- SARIF upload to GitHub Advanced Security
- Multiple report formats

## GitLab CI

Create `.gitlab-ci.yml`:

```yaml
i18n-pilot:
  image: node:20
  script:
    - npm ci
    - npm run build
    - node dist/index.js scan ./src --format json > i18n-report.json
  artifacts:
    reports:
      codequality: i18n-report.json
    paths:
      - i18n-report.json
    when: always
  allow_failure: true
```

## Other CI Platforms

The tool supports standard formats:

- SARIF for GitHub Advanced Security and others
- JSON for custom integrations
- HTML for human-readable reports

You can pipe output to files and upload as artifacts.

## CI Commands

```bash
# Basic scan - fails if any issues
node dist/index.js scan ./src

# JSON report
node dist/index.js scan ./src --format json > report.json

# HTML report
node dist/index.js scan ./src --format html > report.html

# SARIF report (GitHub Advanced Security)
node dist/index.js scan ./src --format sarif > report.sarif

# Custom config and preset
node dist/index.js scan ./src --preset strict
```

## Integration with PR Comments

Use the SARIF upload to have GitHub show i18n issues directly on PRs!
