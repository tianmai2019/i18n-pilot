import fs from 'fs/promises';
import { Project } from 'ts-morph';
import { resolveFiles } from './utils/file-resolver.js';
import { RuleRegistry } from './rules/registry.js';
const DEFAULT_RULE_SETTINGS = {
    i18nCallees: ['t', '$t'],
    whitelist: [],
};
export class Scanner {
    constructor(registry = new RuleRegistry()) {
        this.registry = registry;
    }
    addRule(rule) {
        this.registry.register(rule);
    }
    async scanFile(file, content, project, options) {
        const settings = {
            ...DEFAULT_RULE_SETTINGS,
            ...options?.settings,
            whitelist: options?.whitelist ?? options?.settings?.whitelist ?? DEFAULT_RULE_SETTINGS.whitelist,
        };
        const sourceFile = project.createSourceFile(file, content, { overwrite: true });
        const issues = [];
        for (const { rule, severity } of this.registry.resolve(options?.ruleConfig)) {
            const ruleOptions = { severity, settings, sourceFile };
            const ruleIssues = await rule.check(file, content, ruleOptions);
            issues.push(...ruleIssues.map((issue) => ({ ...issue, severity })));
        }
        return issues;
    }
    async scan(options) {
        const { targetPath, extensions, ignorePatterns, useI18nIgnore = true, onProgress } = options;
        const { files, ignoredCount, i18nIgnoreLoaded } = await resolveFiles({
            targetPath,
            extensions,
            ignorePatterns,
            useI18nIgnore,
        });
        const allIssues = [];
        const errors = [];
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
            }
            catch (err) {
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
