import jsxAttributes from './jsx-attributes.js';
import jsxText from './jsx-text.js';
import stringLiterals from './string-literals.js';
import templateLiterals from './template-literals.js';
import { hasChinese } from './utils/chinese.js';
const splitRules = [stringLiterals, templateLiterals, jsxText, jsxAttributes];
const hardcodedChinese = {
    name: 'hardcoded-chinese',
    description: 'Detect hardcoded Chinese strings in source code',
    async check(file, content, options) {
        if (!options.sourceFile) {
            return content
                .split('\n')
                .map((line, index) => ({ line, index }))
                .filter(({ line }) => hasChinese(line))
                .map(({ line, index }) => ({
                rule: this.name,
                severity: options.severity,
                message: `Possible hardcoded Chinese: "${line.trim()}"`,
                file,
                line: index + 1,
                code: line.trim(),
                context: 'fallback',
                snippet: line.trim(),
            }));
        }
        const issues = [];
        for (const rule of splitRules) {
            const ruleIssues = await rule.check(file, content, {
                ...options,
                severity: options.severity,
            });
            issues.push(...ruleIssues.map((issue) => ({
                ...issue,
                rule: this.name,
                severity: options.severity,
            })));
        }
        return issues;
    },
};
export default hardcodedChinese;
