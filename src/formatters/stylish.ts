import path from 'path';
import chalk from 'chalk';
import type { Issue } from '../types/index.js';

export interface FormatOptions {
  targetPath: string;
  color?: boolean;
}

function paint(enabled: boolean, value: string, color: (input: string) => string): string {
  return enabled ? color(value) : value;
}

export function formatStylish(issues: Issue[], options: FormatOptions): string {
  if (issues.length === 0) {
    return paint(options.color !== false, '\n  ✓ No i18n issues found!\n', chalk.green);
  }

  const color = options.color !== false;
  const lines: string[] = ['\n' + paint(color, 'Issues:', chalk.bold), ''];
  const byFile = new Map<string, Issue[]>();

  for (const issue of issues) {
    if (!byFile.has(issue.file)) byFile.set(issue.file, []);
    byFile.get(issue.file)!.push(issue);
  }

  for (const [file, fileIssues] of byFile) {
    const displayFile = path.relative(options.targetPath, file) || file;
    lines.push(paint(color, displayFile, chalk.underline));

    for (const issue of fileIssues) {
      const severityIcon = issue.severity === 'error' ? '✖' : issue.severity === 'info' ? 'ℹ' : '⚠';
      const severity = paint(
        color,
        severityIcon,
        issue.severity === 'error'
          ? chalk.red
          : issue.severity === 'info'
            ? chalk.blue
            : chalk.yellow
      );
      const location = issue.column ? `L${issue.line}:${issue.column}` : `L${issue.line}`;
      const context = issue.context ? paint(color, `[${issue.context}] `, chalk.gray) : '';
      const scope = issue.component ?? issue.functionName;
      const scopeText = scope ? paint(color, `[${scope}] `, chalk.gray) : '';

      lines.push(
        `  ${severity} ${paint(color, location, chalk.gray)}  ${scopeText}${context}${issue.message}`
      );
      if (issue.snippet) {
        lines.push(`      ${paint(color, issue.snippet, chalk.gray)}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
