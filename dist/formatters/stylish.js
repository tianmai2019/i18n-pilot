import path from 'path';
import chalk from 'chalk';
function paint(enabled, value, color) {
    return enabled ? color(value) : value;
}
export function formatStylish(issues, options) {
    if (issues.length === 0) {
        return paint(options.color !== false, '\n  ✓ No i18n issues found!\n', chalk.green);
    }
    const color = options.color !== false;
    const lines = ['\n' + paint(color, 'Issues:', chalk.bold), ''];
    const byFile = new Map();
    for (const issue of issues) {
        if (!byFile.has(issue.file))
            byFile.set(issue.file, []);
        byFile.get(issue.file).push(issue);
    }
    for (const [file, fileIssues] of byFile) {
        const displayFile = path.relative(options.targetPath, file) || file;
        lines.push(paint(color, displayFile, chalk.underline));
        for (const issue of fileIssues) {
            const severityIcon = issue.severity === 'error' ? '✖' : issue.severity === 'info' ? 'ℹ' : '⚠';
            const severity = paint(color, severityIcon, issue.severity === 'error'
                ? chalk.red
                : issue.severity === 'info'
                    ? chalk.blue
                    : chalk.yellow);
            const location = issue.column ? `L${issue.line}:${issue.column}` : `L${issue.line}`;
            const context = issue.context ? paint(color, `[${issue.context}] `, chalk.gray) : '';
            const scope = issue.component ?? issue.functionName;
            const scopeText = scope ? paint(color, `[${scope}] `, chalk.gray) : '';
            lines.push(`  ${severity} ${paint(color, location, chalk.gray)}  ${scopeText}${context}${issue.message}`);
            if (issue.snippet) {
                lines.push(`      ${paint(color, issue.snippet, chalk.gray)}`);
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}
