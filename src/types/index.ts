import type { SourceFile } from 'ts-morph';

export type Severity = 'error' | 'warning' | 'info';
export type RuleLevel = Severity | 'off';
export type RuleConfig = Record<string, RuleLevel>;
export type OutputFormat = 'stylish' | 'compact';

export interface RuleSettings {
  i18nCallees: string[];
  whitelist: string[];
}

export interface RuleOptions {
  severity: Severity;
  settings: RuleSettings;
  sourceFile?: SourceFile;
}

export interface Issue {
  rule: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column?: number;
  code?: string;
  context?: 'string' | 'template' | 'jsx-text' | 'jsx-attribute' | 'fallback';
  suggestion?: string;
  snippet?: string;
  component?: string;
  functionName?: string;
}

export interface Rule {
  name: string;
  description: string;
  defaultSeverity?: Severity;
  check(file: string, content: string, options: RuleOptions): Promise<Issue[]>;
}

export interface ScanOptions {
  targetPath: string;
  extensions?: string[];
  ignorePatterns?: string[];
  useI18nIgnore?: boolean;
  ruleConfig?: RuleConfig;
  settings?: Partial<RuleSettings>;
  whitelist?: string[];
  onProgress?: (current: number, total: number, file: string) => void;
}

export interface ScanResult {
  fileCount: number;
  issueCount: number;
  issues: Issue[];
  errors: string[];
  ignoredCount: number;
  i18nIgnoreLoaded: boolean;
}
