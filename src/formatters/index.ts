import type { Issue, OutputFormat, ScanResult } from '../types/index.js';
import { formatCompact } from './compact.js';
import { formatStylish, type FormatOptions } from './stylish.js';
import { formatJson } from './json.js';
import { formatHtml } from './html.js';
import { formatSarif } from './sarif.js';

export function formatIssues(
  format: OutputFormat,
  issues: Issue[],
  options: FormatOptions
): string {
  if (format === 'compact') {
    return formatCompact(issues, options);
  }

  if (format === 'json') {
    // Fallback for backward compatibility
    return JSON.stringify({ issues }, null, 2);
  }

  return formatStylish(issues, options);
}

export function formatResult(
  format: OutputFormat,
  result: ScanResult,
  options: FormatOptions
): string {
  if (format === 'json') {
    return formatJson(result);
  }
  if (format === 'html') {
    return formatHtml(result, options);
  }
  if (format === 'sarif') {
    return formatSarif(result, options);
  }
  return formatIssues(format, result.issues, options);
}

export { formatCompact, formatStylish, formatJson, formatHtml, formatSarif };
export type { FormatOptions };
