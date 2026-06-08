import fs from 'fs/promises';
import type { Rule, ScanOptions, ScanResult, Issue } from './types/index.js';
import { resolveFiles } from './utils/file-resolver.js';

export class Scanner {
  private rules: Rule[] = [];

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  async scanFile(file: string): Promise<Issue[]> {
    const content = await fs.readFile(file, 'utf-8');
    const issues: Issue[] = [];
    for (const rule of this.rules) {
      const ruleIssues = await rule.check(file, content);
      issues.push(...ruleIssues);
    }
    return issues;
  }

  async scan(options: ScanOptions): Promise<ScanResult> {
    const { targetPath, extensions, ignorePatterns, useI18nIgnore = true, onProgress } = options;

    const { files, ignoredCount, i18nIgnoreLoaded } = await resolveFiles({
      targetPath,
      extensions,
      ignorePatterns,
      useI18nIgnore,
    });

    const allIssues: Issue[] = [];
    const errors: string[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      if (onProgress) {
        onProgress(i + 1, total, file);
      }
      try {
        const issues = await this.scanFile(file);
        allIssues.push(...issues);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${file}: ${message}`);
      }
    }

    return {
      fileCount: total,
      issueCount: allIssues.length,
      issues: allIssues,
      errors,
      ignoredCount,
      i18nIgnoreLoaded,
    };
  }
}
