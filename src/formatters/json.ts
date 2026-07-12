import type { Issue } from '../types/index.js';
import type { ScanResult } from '../types/index.js';

export interface JsonOutput {
  schemaVersion: '1.0.0';
  generatedAt: string;
  result: {
    fileCount: number;
    issueCount: number;
    errors: string[];
    ignoredCount: number;
  };
  issues: Array<{
    rule: string;
    severity: string;
    message: string;
    file: string;
    line: number;
    column?: number;
    code?: string;
    snippet?: string;
    component?: string;
    functionName?: string;
  }>;
  files: Record<string, Issue[]>;
  summary: {
    byRule: Record<string, number>;
    bySeverity: Record<string, number>;
    byFile: Record<string, number>;
  };
}

export function formatJson(result: ScanResult): string {
  const output: JsonOutput = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    result: {
      fileCount: result.fileCount,
      issueCount: result.issueCount,
      errors: result.errors,
      ignoredCount: result.ignoredCount,
    },
    issues: result.issues.map((issue) => ({
      rule: issue.rule,
      severity: issue.severity,
      message: issue.message,
      file: issue.file,
      line: issue.line,
      column: issue.column,
      code: issue.code,
      snippet: issue.snippet,
      component: issue.component,
      functionName: issue.functionName,
    })),
    files: {},
    summary: {
      byRule: {},
      bySeverity: {},
      byFile: {},
    },
  };

  // Group issues by file
  for (const issue of result.issues) {
    if (!output.files[issue.file]) {
      output.files[issue.file] = [];
    }
    output.files[issue.file].push(issue);
  }

  // Calculate summary by rule
  for (const issue of result.issues) {
    output.summary.byRule[issue.rule] = (output.summary.byRule[issue.rule] || 0) + 1;
  }

  // Calculate summary by severity
  for (const issue of result.issues) {
    output.summary.bySeverity[issue.severity] =
      (output.summary.bySeverity[issue.severity] || 0) + 1;
  }

  // Calculate summary by file
  for (const issue of result.issues) {
    output.summary.byFile[issue.file] = (output.summary.byFile[issue.file] || 0) + 1;
  }

  return JSON.stringify(output, null, 2);
}
