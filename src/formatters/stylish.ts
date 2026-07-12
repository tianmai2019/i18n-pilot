import path from 'path';
import chalk from 'chalk';
import type { Issue } from '../types/index.js';

export interface FormatOptions {
  targetPath: string;
  color?: boolean;
  showSummary?: boolean;
}

function paint(enabled: boolean, value: string, color: (input: string) => string): string {
  return enabled ? color(value) : value;
}

interface SummaryStats {
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  filesWithIssues: number;
  byRule: Map<string, number>;
}

function calculateSummary(issues: Issue[]): SummaryStats {
  const stats: SummaryStats = {
    totalIssues: issues.length,
    errors: 0,
    warnings: 0,
    info: 0,
    filesWithIssues: new Set(issues.map((i) => i.file)).size,
    byRule: new Map(),
  };

  for (const issue of issues) {
    if (issue.severity === 'error') stats.errors++;
    else if (issue.severity === 'warning') stats.warnings++;
    else if (issue.severity === 'info') stats.info++;

    stats.byRule.set(issue.rule, (stats.byRule.get(issue.rule) || 0) + 1);
  }

  return stats;
}

function formatSummary(stats: SummaryStats, color: boolean): string {
  const lines: string[] = [];

  lines.push(paint(color, 'Summary:', chalk.bold));
  lines.push('');

  const totalLine = [
    paint(color, stats.totalIssues.toString(), chalk.bold),
    'issues in',
    paint(color, stats.filesWithIssues.toString(), chalk.bold),
    'files',
  ].join(' ');
  lines.push(`  ${totalLine}`);

  const parts: string[] = [];
  if (stats.errors > 0) {
    parts.push(paint(color, `${stats.errors} errors`, chalk.red));
  }
  if (stats.warnings > 0) {
    parts.push(paint(color, `${stats.warnings} warnings`, chalk.yellow));
  }
  if (stats.info > 0) {
    parts.push(paint(color, `${stats.info} info`, chalk.blue));
  }
  if (parts.length > 0) {
    lines.push(`  ${parts.join(', ')}`);
  }

  lines.push('');
  lines.push(paint(color, 'By rule:', chalk.bold));
  const sortedRules = [...stats.byRule.entries()].sort((a, b) => b[1] - a[1]);
  for (const [rule, count] of sortedRules) {
    lines.push(`  ${rule}: ${paint(color, count.toString(), chalk.cyan)}`);
  }

  return lines.join('\n');
}

export function formatStylish(issues: Issue[], options: FormatOptions): string {
  const color = options.color !== false;
  const showSummary = options.showSummary !== false;

  if (issues.length === 0) {
    return paint(color, '\n  ✓ No i18n issues found!\n', chalk.green);
  }

  const lines: string[] = ['\n' + paint(color, 'Issues:', chalk.bold), ''];
  const byFile = new Map<string, Issue[]>();

  for (const issue of issues) {
    if (!byFile.has(issue.file)) byFile.set(issue.file, []);
    byFile.get(issue.file)!.push(issue);
  }

  // Sort files by path for consistent output
  const sortedFiles = [...byFile.keys()].sort();

  for (const file of sortedFiles) {
    const fileIssues = byFile.get(file)!;
    const displayFile = path.relative(options.targetPath, file) || file;
    lines.push(paint(color, displayFile, chalk.underline));

    // Sort issues by line number
    const sortedIssues = [...fileIssues].sort((a, b) => a.line - b.line);

    for (const issue of sortedIssues) {
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
      const ruleTag = paint(color, `[${issue.rule}]`, chalk.dim);

      lines.push(
        `  ${severity} ${paint(color, location, chalk.gray)}  ${scopeText}${context}${issue.message} ${ruleTag}`
      );
      if (issue.snippet) {
        lines.push(`      ${paint(color, issue.snippet, chalk.gray)}`);
      }
    }

    lines.push('');
  }

  // Add summary if requested
  if (showSummary) {
    const summary = calculateSummary(issues);
    lines.push(formatSummary(summary, color));
    lines.push('');
  }

  return lines.join('\n');
}
