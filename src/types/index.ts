export interface Issue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column?: number;
  code?: string;
}

export interface Rule {
  name: string;
  description: string;
  check(file: string, content: string): Promise<Issue[]>;
}

export interface ScanResult {
  fileCount: number;
  issueCount: number;
  issues: Issue[];
  errors: string[];
}
