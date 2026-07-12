# i18n-pilot

[English](./README.md) | 简体中文

> 面向现代前端项目的 i18n 质量门禁和债务扫描工具。

![i18n-pilot logo](./assets/logo.svg)

## 项目简介

`i18n-pilot` 是一个 CLI 工具，目标是帮助团队在代码进入生产环境之前发现国际化债务。

它不再定位为另一个一次性的 AI 翻译工具。当前版本聚焦在「检测」：扫描源码、发现硬编码的用户可见文案，并报告项目里哪些地方还需要做 i18n 治理。

长期目标是成为现代前端团队轻量级的 i18n 质量门禁：先做好 CLI，再逐步支持 CI 检查、Pull Request 报告、历史趋势和项目级 i18n 记忆。

## 当前功能

- 从命令行扫描项目目录
- 检测 JavaScript / TypeScript / JSX / TSX 文件里的硬编码中文字符串
- 检测 JSX 文本节点和属性里的中文文案
- 默认跳过 `node_modules`、`.git`、`dist`、`build` 等依赖或生成目录
- 支持 5 种输出格式：stylish、compact、JSON、HTML 和 SARIF
- 支持通过 `.i18nrc.json` 和 `.i18nignore` 配置
- 内置预设：recommended、strict、minimal
- GitHub Actions 集成，支持 SARIF 上传到 GitHub Advanced Security
- 生成美观的交互式 HTML 报告

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

### 初始化配置（可选）

```bash
node dist/index.js init --preset recommended
```

这会创建：
- `.i18nrc.json` - 配置文件
- `.i18nignore` - 要忽略的文件和目录

### 扫描你的项目

```bash
# 基础扫描（stylish 格式）
node dist/index.js scan ./src

# 使用不同的输出格式
node dist/index.js scan ./src --format compact
node dist/index.js scan ./src --format json > report.json
node dist/index.js scan ./src --format html > report.html
node dist/index.js scan ./src --format sarif > report.sarif

# 使用预设
node dist/index.js scan ./src --preset strict

# 列出可用的预设
node dist/index.js presets
```

## 命令

### `scan [path]`

扫描目录中的 i18n 问题。

选项：
- `--no-i18nignore` - 禁用 `.i18nignore` 支持
- `--ext <extensions...>` - 要扫描的文件扩展名（默认：js, jsx, ts, tsx）
- `--ignore <patterns...>` - 额外的 glob 忽略模式
- `--format <format>` - 输出格式：stylish, compact, json, html, sarif（默认：stylish）
- `--rule <rules...>` - 规则配置项（例如：jsx-text=off）
- `--whitelist <strings...>` - 要忽略的特定字符串
- `--preset <preset>` - 使用预设配置（recommended, strict, minimal）
- `--config <path>` - 配置文件路径（尚未实现）
- `--no-config` - 禁用配置文件加载

### `init`

初始化 i18n-pilot 配置。

选项：
- `--preset <preset>` - 使用预设配置（默认：recommended）
- `--force` - 覆盖已存在的配置文件

### `presets`

列出可用的预设。

## 配置

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

## 预设

| 预设 | 描述 |
|------|------|
| `recommended` | JSX 文本作为 error，字符串字面量作为 info |
| `strict` | 所有规则作为 error |
| `minimal` | 仅关键问题作为 error |

## 输出格式

### `stylish`（默认）

美观、人类可读的终端输出，包含统计信息。

### `compact`

紧凑的机器可读格式，类似于 ESLint 的 compact 格式。

### `json`

完整的结构化 JSON 数据，用于自定义集成。

### `html`

美观、交互式的 HTML 报告，支持折叠/展开。

### `sarif`

SARIF 2.1.0 格式，用于 GitHub Advanced Security 集成。

## CI 集成

### GitHub Actions

创建 `.github/workflows/i18n-pilot.yml`：

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

查看 [CI_SETUP.md](./CI_SETUP.md) 获取完整文档，包括 GitLab CI 示例。

## 规则

| 规则 | 描述 |
|------|------|
| `jsx-text` | JSX 文本节点中的硬编码中文 |
| `jsx-attributes` | JSX 属性中的硬编码中文 |
| `string-literals` | 字符串字面量中的硬编码中文 |
| `template-literals` | 模板字符串中的硬编码中文 |

## 项目结构

```text
code/
├── src/
│   ├── cli.ts                         # CLI 命令定义
│   ├── index.ts                       # CLI 运行入口
│   ├── scanner.ts                     # 文件遍历和规则执行
│   ├── rules/
│   │   ├── index.ts                   # 规则注册器
│   │   ├── jsx-text.ts                # JSX 文本规则
│   │   ├── jsx-attributes.ts          # JSX 属性规则
│   │   ├── string-literals.ts         # 字符串字面量规则
│   │   └── template-literals.ts       # 模板字符串规则
│   ├── formatters/
│   │   ├── index.ts                   # 格式化器注册器
│   │   ├── stylish.ts                 # Stylish 输出
│   │   ├── compact.ts                 # Compact 输出
│   │   ├── json.ts                    # JSON 输出
│   │   ├── html.ts                    # HTML 报告
│   │   └── sarif.ts                   # SARIF 输出
│   ├── config/
│   │   ├── index.ts                   # 配置加载器
│   │   └── presets.ts                 # 内置预设
│   ├── types/
│   │   └── index.ts                   # 类型定义
│   └── utils/
│       └── cli/validation.ts          # CLI 验证工具
├── examples/
│   └── TestComponent.jsx
├── .github/
│   └── workflows/
│       └── i18n-pilot.yml             # GitHub Actions 工作流
├── CI_SETUP.md                        # CI 集成指南
├── package.json
└── tsconfig.json
```

## Roadmap

- [ ] 发布 v0.1.0 到 npm
- [ ] VS Code 插件
- [ ] 项目记忆和历史追踪
- [ ] Vue 支持
- [ ] 翻译文件校验
- [ ] i18n 健康度评分

## 产品定位

`i18n-pilot` 不是 i18next、vue-i18n、FormatJS、Crowdin 或 Lokalise 的替代品。

它更适合放在这些工具之前或周围，作为质量门禁使用：

```text
source code → i18n-pilot scan/check → i18n framework / TMS / CI
```

## License

MIT
