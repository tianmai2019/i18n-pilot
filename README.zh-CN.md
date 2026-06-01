# i18n-pilot

[English](./README.md) | 简体中文

> 面向现代前端项目的 AI 国际化工具。

![i18n-pilot logo](./assets/logo.svg)

## 项目简介

`i18n-pilot` 是一个早期阶段的 CLI 工具，目标是帮助开发者扫描代码中的用户可见文案，并将这些文案整理成适合国际化处理的形式。当前 Demo 主要面向包含中文文案的 React/JSX 文件，可以提取可翻译字符串，并调用 AI 翻译 API 进行翻译。

这个仓库目前处于 MVP 探索阶段。当前目标不是一次性做完整产品，而是先验证一个最小可行工作流，再逐步演进成真正实用的 AI 国际化助手。

## 当前功能

- 读取 React/JSX 示例文件
- 从源码中提取中文字符串
- 使用火山引擎方舟 API 翻译提取出的文案
- 提供基于 Commander 的 TypeScript CLI 基础框架
- 同时包含 JavaScript/TypeScript 和 Python Demo 代码

## 项目结构

```text
code/
├── src/
│   ├── api.js          # 火山引擎方舟 API 调用 Demo
│   ├── extractor.js    # 文件读取和中文字符串提取
│   ├── demo.js         # JavaScript Demo 流程
│   ├── cli.ts          # TypeScript CLI 命令定义
│   └── index.ts        # TypeScript CLI 运行入口
├── examples/
│   └── TestComponent.jsx
├── demo.py             # Python Demo 版本
├── assets/
│   └── logo.svg
├── package.json
└── tsconfig.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm
- Python 3，如果你想运行 Python Demo
- 火山引擎方舟 API Key 和模型接入点 ID

### 安装依赖

```bash
cd code
npm install
```

### 构建 TypeScript CLI

```bash
npm run build
```

### 运行 CLI 示例命令

```bash
node dist/index.js translate "你好，世界"
```

预期输出：

```text
Translate request: 你好，世界
```

> 注意：当前 TypeScript CLI 命令还是占位 Demo，暂时不会调用真实 API。

## 运行翻译 Demo

### 方式一：Python Demo

```bash
cd code
python3 demo.py
```

### 方式二：JavaScript Demo

```bash
cd code
npm run build
npm run demo
```

## API 配置

Demo 使用火山引擎方舟的 OpenAI 兼容 Chat Completions 接口。你可以通过环境变量进行配置：

```bash
export ARK_API_KEY="你的火山引擎方舟 API Key"
export ARK_MODEL="你的模型接入点 ID，例如 ep-xxxxxxxx"
export ARK_API_URL="https://ark.cn-beijing.volces.com/api/v3/chat/completions"
```

如果 API 返回 `401`，请重点检查：

1. `ARK_API_KEY` 是火山引擎生成的 API Key，不是 Claude Code 或 Anthropic Key。
2. `ARK_MODEL` 是火山引擎控制台中的模型接入点 ID。
3. `ARK_API_URL` 与你的火山引擎地域和接入方式匹配。

## Roadmap

- [ ] 将 TypeScript CLI 接入真实翻译 API
- [ ] 自动生成 locale JSON 文件
- [ ] 支持更多前端文件类型
- [ ] 支持安全地将翻译结果写回源文件
- [ ] 增加语言目标和忽略规则配置文件
- [ ] 发布 MVP npm 包

## 为什么做这个项目

很多团队都希望让产品触达全球用户，但国际化工作通常重复、繁琐，也很容易被推迟。`i18n-pilot` 希望先解决第一步：扫描代码、理解哪些文案需要翻译，并帮助开发者更快地交付多语言产品。

## License

MIT
