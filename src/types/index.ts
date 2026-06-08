export interface Issue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column?: number;
  code?: string;
  context?: 'string' | 'template' | 'jsx-text' | 'jsx-attribute' | 'fallback';
  suggestion?: string;
}

export interface Rule {
  name: string;
  description: string;
  check(file: string, content: string): Promise<Issue[]>;
}

export interface ScanOptions {
  targetPath: string;
  extensions?: string[];
  ignorePatterns?: string[];
  useI18nIgnore?: boolean;
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
