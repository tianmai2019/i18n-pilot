import path from 'path';
import type { Issue } from '../types/index.js';
import type { FormatOptions } from './stylish.js';

export function formatCompact(issues: Issue[], options: FormatOptions): string {
  if (issues.length === 0) return '';

  return issues
    .map((issue) => {
      const file = path.relative(options.targetPath, issue.file) || issue.file;
      const column = issue.column ?? 1;
      return `${file}:${issue.line}:${column}: ${issue.severity} ${issue.message} ${issue.rule}`;
    })
    .join('\n');
}
