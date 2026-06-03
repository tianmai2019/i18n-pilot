# i18n-pilot

[English](./README.md) | 简体中文

> 面向现代前端项目的 i18n 质量门禁和债务扫描工具。

![i18n-pilot logo](./assets/logo.svg)

## 项目简介

`i18n-pilot` 是一个早期阶段的 CLI 工具，目标是帮助团队在代码进入生产环境之前发现国际化债务。

它不再定位为另一个一次性的 AI 翻译工具。当前第一版聚焦在“检测”：扫描源码、发现硬编码的用户可见文案，并报告项目里哪些地方还需要做 i18n 治理。

长期目标是成为现代前端团队轻量级的 i18n 质量门禁：先做好 CLI，再逐步支持 CI 检查、Pull Request 报告、历史趋势和项目级 i18n 记忆。

## 为什么做这个

AI 编辑器可以帮你翻译一次字符串，但它通常不能持续回答这些问题：

- 这次 PR 有没有新增硬编码的用户可见文案？
- 哪些文件的 i18n 债务最多？
- 项目的 i18n 债务是在变好还是变坏？
- 哪些字符串已经通过 `t()`、`$t()` 或 `formatMessage()` 处理过？
- 能不能在 CI 阶段阻止 i18n 质量倒退？

`i18n-pilot` 关注的是这些工程治理问题。

## 当前功能

当前 MVP 可以：

- 从命令行扫描项目目录
- 检测 JavaScript / TypeScript / JSX / TSX 文件里的硬编码中文字符串
- 检测 JSX 文本节点里的中文文案
- 默认跳过 `node_modules`、`.git`、`dist`、`backup` 等依赖或生成目录
- 在终端按文件分组输出报告，包含文件名、行号和规则提示

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
cd code
npm install
```

### 构建 CLI

```bash
npm run build
```

### 扫描示例项目

```bash
node dist/index.js scan examples
```

示例输出：

```text
🔍 i18n-pilot scan
   Scanning: examples

Scan Results:
────────────────────────────────────────────────────────────
  Files scanned:  1
  Issues found:   8
────────────────────────────────────────────────────────────
```

### 未来 npm 使用方式

包正式发布后，目标使用方式是：

```bash
npx i18n-pilot scan ./src
```

## 项目结构

```text
code/
├── src/
│   ├── cli.ts                         # CLI 命令定义
│   ├── index.ts                       # CLI 运行入口
│   ├── scanner.ts                     # 文件遍历和规则执行
│   ├── rules/
│   │   └── hardcoded-chinese.ts       # 第一条 i18n 债务检测规则
│   └── types/
│       └── index.ts                   # Rule、Issue、ScanResult 类型
├── backup/                            # 早期翻译 Demo 参考代码
├── examples/
│   └── TestComponent.jsx
├── assets/
│   └── logo.svg
├── package.json
└── tsconfig.json
```

## Roadmap

### Phase 1：核心 CLI

- [x] 添加 `scan` 命令
- [x] 添加第一条规则：硬编码中文检测
- [ ] 更准确地检测 JSX 属性和模板字符串
- [ ] 忽略已国际化的字符串，例如 `t('key')` 和 `$t('key')`
- [ ] 支持 `.i18nignore`
- [ ] 增加 JSON 输出，为 CI 集成做准备
- [ ] 发布 v0.1.0 到 npm

### Phase 2：CI 和项目记忆

- [ ] 添加 `check` 命令作为 CI 质量门禁
- [ ] 支持 GitHub Action
- [ ] 将本地扫描历史保存到 `.i18n-pilot/`
- [ ] 添加 `history` 和 `diff` 命令

### Phase 3：多框架和健康度评分

- [ ] 支持 Vue 和 Next.js 项目
- [ ] 校验 locale 文件
- [ ] 增加 i18n 健康度评分
- [ ] 支持社区规则

## 产品定位

`i18n-pilot` 不是 i18next、vue-i18n、FormatJS、Crowdin 或 Lokalise 的替代品。

它更适合放在这些工具之前或周围，作为质量门禁使用：

```text
source code → i18n-pilot scan/check → i18n framework / TMS / CI
```

## License

MIT
