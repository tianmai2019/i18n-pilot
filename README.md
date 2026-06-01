# i18n-pilot

English | [简体中文](./README.zh-CN.md)

> AI-powered internationalization tooling for modern frontend projects.

![i18n-pilot logo](./assets/logo.svg)

## Overview

`i18n-pilot` is an early-stage CLI tool that helps developers find user-facing text in a codebase and prepare it for internationalization. The current demo focuses on React/JSX files with Chinese text, extracts translatable strings, and sends them to an AI translation API.

This repository is currently in MVP exploration mode. The goal is to validate a simple workflow first, then gradually grow it into a practical i18n assistant for global products.

## What It Does Today

- Reads a React/JSX example file
- Extracts Chinese strings from the source code
- Translates extracted strings with the Volcengine Ark API
- Provides a basic TypeScript CLI skeleton powered by Commander
- Includes both JavaScript/TypeScript and Python demo code

## Project Structure

```text
code/
├── src/
│   ├── api.js          # Volcengine Ark API call demo
│   ├── extractor.js    # File reading and Chinese string extraction
│   ├── demo.js         # JavaScript demo flow
│   ├── cli.ts          # TypeScript CLI entry definition
│   └── index.ts        # TypeScript CLI runtime entry
├── examples/
│   └── TestComponent.jsx
├── demo.py             # Python demo version
├── assets/
│   └── logo.svg
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python 3, if you want to run the Python demo
- A Volcengine Ark API key and model endpoint ID

### Install Dependencies

```bash
cd code
npm install
```

### Build the TypeScript CLI

```bash
npm run build
```

### Run the CLI Demo Command

```bash
node dist/index.js translate "你好，世界"
```

Expected output:

```text
Translate request: 你好，世界
```

> Note: the current TypeScript CLI command is a placeholder and does not call the real API yet.

## Run the Translation Demo

### Option 1: Python Demo

```bash
cd code
python3 demo.py
```

### Option 2: JavaScript Demo

```bash
cd code
npm run build
npm run demo
```

## API Configuration

The demo uses the Volcengine Ark OpenAI-compatible chat completions endpoint. Configure it with environment variables:

```bash
export ARK_API_KEY="your-volcengine-ark-api-key"
export ARK_MODEL="your-model-endpoint-id, for example ep-xxxxxxxx"
export ARK_API_URL="https://ark.cn-beijing.volces.com/api/v3/chat/completions"
```

If the API returns `401`, check the following:

1. `ARK_API_KEY` is a Volcengine API key, not a Claude Code or Anthropic key.
2. `ARK_MODEL` is the model endpoint ID from the Volcengine console.
3. `ARK_API_URL` matches your Volcengine region and endpoint type.

## Roadmap

- [ ] Connect the TypeScript CLI to the real translation API
- [ ] Generate locale JSON files automatically
- [ ] Support more frontend file types
- [ ] Add safe write-back for translated source files
- [ ] Add configuration files for language targets and ignore rules
- [ ] Publish an MVP package to npm

## Why This Project

Many teams want to reach global users, but i18n work is still repetitive and easy to postpone. `i18n-pilot` aims to make the first step easier: scan the code, understand what needs translation, and help developers ship multilingual products faster.

## License

MIT
