import fs from 'fs/promises';
import path from 'path';
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
    async scanDirectory(dir) {
        const allIssues = [];
        const errors = [];
        let fileCount = 0;
        const walk = async (currentDir) => {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (['node_modules', '.git', 'dist', 'backup', '__tests__'].includes(entry.name))
                        continue;
                    await walk(fullPath);
                }
                else if (/\.(test|spec)\.(tsx?|jsx?)$/.test(entry.name)) {
                    continue;
                }
                else if (/\.(tsx?|jsx?|vue|svelte)$/.test(entry.name)) {
                    fileCount++;
                    try {
                        const issues = await this.scanFile(fullPath);
                        allIssues.push(...issues);
                    }
                    catch (err) {
                        const message = err instanceof Error ? err.message : String(err);
                        errors.push(`${fullPath}: ${message}`);
                    }
                }
            }
        };
        await walk(dir);
        return { fileCount, issueCount: allIssues.length, issues: allIssues, errors };
    }
}
