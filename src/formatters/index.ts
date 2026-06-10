import type { Issue, OutputFormat } from '../types/index.js';
import { formatCompact } from './compact.js';
import { formatStylish, type FormatOptions } from './stylish.js';

export function formatIssues(
  format: OutputFormat,
  issues: Issue[],
  options: FormatOptions
): string {
  if (format === 'compact') {
    return formatCompact(issues, options);
  }

  return formatStylish(issues, options);
}

export { formatCompact, formatStylish };
export type { FormatOptions };
