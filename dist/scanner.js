import fs from 'fs/promises';
import { resolveFiles } from './utils/file-resolver.js';
export class Scanner {
    constructor() {
        this.rules = [];
    }
    addRule(rule) {
        this.rules.push(rule);
    }
    async scanFile(file) {
        const content = await fs.readFile(file, 'utf-8');
        const issues = [];
        for (const rule of this.rules) {
            const ruleIssues = await rule.check(file, content);
            issues.push(...ruleIssues);
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
        for (let i = 0; i < total; i++) {
            const file = files[i];
            if (onProgress) {
                onProgress(i + 1, total, file);
            }
            try {
                const issues = await this.scanFile(file);
                allIssues.push(...issues);
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
