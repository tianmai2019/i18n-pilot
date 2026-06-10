import fs from 'fs/promises';
import { Project } from 'ts-morph';
import type {
  Rule,
  RuleOptions,
  RuleSettings,
  ScanOptions,
  ScanResult,
  Issue,
} from './types/index.js';
import { resolveFiles } from './utils/file-resolver.js';
import { RuleRegistry } from './rules/registry.js';

const DEFAULT_RULE_SETTINGS: RuleSettings = {
  i18nCallees: ['t', '$t'],
  whitelist: [],
};

export class Scanner {
  private registry: RuleRegistry;

  constructor(registry = new RuleRegistry()) {
    this.registry = registry;
  }

  addRule(rule: Rule): void {
    this.registry.register(rule);
  }

  async scanFile(
    file: string,
    content: string,
    project: Project,
    options?: Partial<ScanOptions>
  ): Promise<Issue[]> {
    const settings: RuleSettings = {
      ...DEFAULT_RULE_SETTINGS,
      ...options?.settings,
      whitelist:
        options?.whitelist ?? options?.settings?.whitelist ?? DEFAULT_RULE_SETTINGS.whitelist,
    };

    const sourceFile = project.createSourceFile(file, content, { overwrite: true });
    const issues: Issue[] = [];

    for (const { rule, severity } of this.registry.resolve(options?.ruleConfig)) {
      const ruleOptions: RuleOptions = { severity, settings, sourceFile };
      const ruleIssues = await rule.check(file, content, ruleOptions);
      issues.push(...ruleIssues.map((issue) => ({ ...issue, severity })));
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

    // Create single project instance for all files
    const project = new Project({ useInMemoryFileSystem: true });

    for (let i = 0; i < total; i++) {
      const file = files[i];
      if (onProgress) {
        onProgress(i + 1, total, file);
      }
      try {
        const content = await fs.readFile(file, 'utf-8');
        const sourceFileCount = project.getSourceFiles().length;
        const issues = await this.scanFile(file, content, project, options);
        allIssues.push(...issues);
        // Clear cached source files to save memory
        project.removeSourceFile(project.getSourceFiles()[sourceFileCount]);
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
