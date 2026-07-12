import path from 'path';
import type { Issue, ScanResult } from '../types/index.js';

export function formatHtml(result: ScanResult, options: { targetPath: string; title?: string }): string {
  const { issues, fileCount, issueCount } = result;
  const { targetPath, title = 'i18n-pilot Report' } = options;

  const byFile = new Map<string, Issue[]>();
  const byRule = new Map<string, Issue[]>();
  const bySeverity = new Map<string, Issue[]>();

  for (const issue of issues) {
    if (!byFile.has(issue.file)) byFile.set(issue.file, []);
    byFile.get(issue.file)!.push(issue);

    if (!byRule.has(issue.rule)) byRule.set(issue.rule, []);
    byRule.get(issue.rule)!.push(issue);

    if (!bySeverity.has(issue.severity)) bySeverity.set(issue.severity, []);
    bySeverity.get(issue.severity)!.push(issue);
  }

  const sortedFiles = Array.from(byFile.keys()).sort();
  const sortedRules = Array.from(byRule.keys()).sort((a, b) => byRule.get(b)!.length - byRule.get(a)!.length);

  const errorCount = bySeverity.get('error')?.length || 0;
  const warningCount = bySeverity.get('warning')?.length || 0;
  const infoCount = bySeverity.get('info')?.length || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .header {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header h1 {
      color: #667eea;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    .header p { color: #666; font-size: 1rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .stat-card {
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
      color: white;
    }
    .stat-card.error { background: #ef4444; }
    .stat-card.warning { background: #f59e0b; }
    .stat-card.info { background: #3b82f6; }
    .stat-card.total { background: #667eea; }
    .stat-value { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.25rem; }
    .stat-label { font-size: 0.875rem; opacity: 0.9; }
    .section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .section h2 {
      color: #667eea;
      margin-bottom: 1rem;
      font-size: 1.5rem;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    .rule-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .rule-tag {
      background: #f0f9ff;
      color: #0369a1;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }
    .rule-tag strong { font-weight: 600; }
    .file-item {
      margin-bottom: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .file-header {
      background: #f9fafb;
      padding: 1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }
    .file-header:hover { background: #f3f4f6; }
    .file-path {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      color: #374151;
    }
    .file-count {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .file-content {
      padding: 1rem;
      display: none;
    }
    .file-content.open { display: block; }
    .issue-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 3px solid;
    }
    .issue-item.error { border-left-color: #ef4444; }
    .issue-item.warning { border-left-color: #f59e0b; }
    .issue-item.info { border-left-color: #3b82f6; }
    .issue-icon {
      font-size: 1.25rem;
      line-height: 1;
      width: 1.5rem;
      text-align: center;
    }
    .issue-main { flex: 1; min-width: 0; }
    .issue-rule {
      display: inline-block;
      background: #e5e7eb;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 0.25rem;
    }
    .issue-message { font-weight: 500; color: #111827; margin-bottom: 0.25rem; }
    .issue-location {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .issue-context {
      font-size: 0.75rem;
      color: #6b7280;
      display: flex;
      gap: 1rem;
    }
    .issue-snippet {
      background: #1f2937;
      color: #e5e7eb;
      padding: 0.75rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.8rem;
      margin-top: 0.5rem;
      overflow-x: auto;
    }
    .footer {
      text-align: center;
      color: white;
      padding: 2rem;
      font-size: 0.875rem;
      opacity: 0.9;
    }
    .footer a { color: white; text-decoration: underline; }
    @media (max-width: 768px) {
      .container { padding: 1rem; }
      .header { padding: 1.5rem; }
      .section { padding: 1.5rem; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>🔍 i18n-pilot Report</h1>
      <p>Scanned ${fileCount} file${fileCount === 1 ? '' : 's'} • ${issueCount} issue${issueCount === 1 ? '' : 's'} found</p>
      <div class="stats-grid">
        <div class="stat-card error">
          <div class="stat-value">${errorCount}</div>
          <div class="stat-label">Errors</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">${warningCount}</div>
          <div class="stat-label">Warnings</div>
        </div>
        <div class="stat-card info">
          <div class="stat-value">${infoCount}</div>
          <div class="stat-label">Info</div>
        </div>
        <div class="stat-card total">
          <div class="stat-value">${issueCount}</div>
          <div class="stat-label">Total Issues</div>
        </div>
      </div>
    </header>

    <section class="section">
      <h2>📊 Issues by Rule</h2>
      <div class="rule-list">
        ${sortedRules.map(rule => `<div class="rule-tag"><strong>${rule}</strong> ${byRule.get(rule)!.length}</div>`).join('')}
      </div>
    </section>

    <section class="section">
      <h2>📁 Files</h2>
      ${sortedFiles.map(file => {
        const fileIssues = byFile.get(file)!;
        const relativePath = path.relative(targetPath, file) || file;
        return `
          <div class="file-item">
            <div class="file-header" onclick="this.nextElementSibling.classList.toggle('open')">
              <span class="file-path">${escapeHtml(relativePath)}</span>
              <span class="file-count">${fileIssues.length}</span>
            </div>
            <div class="file-content">
              ${fileIssues.map(issue => renderIssue(issue)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </section>

    <footer class="footer">
      Generated by i18n-pilot • <a href="https://github.com/yourusername/i18n-pilot">View on GitHub</a>
    </footer>
  </div>

  <script>
    // First file opens by default
    const firstContent = document.querySelector('.file-content');
    if (firstContent) {
      firstContent.classList.add('open');
    }
  </script>
</body>
</html>`;
}

function renderIssue(issue: Issue): string {
  const severity = issue.severity;
  const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
  const location = issue.column ? `L${issue.line}:${issue.column}` : `L${issue.line}`;
  const contextParts: string[] = [];

  if (issue.component) {
    contextParts.push(`<span>Component: ${escapeHtml(issue.component)}</span>`);
  } else if (issue.functionName) {
    contextParts.push(`<span>Function: ${escapeHtml(issue.functionName)}</span>`);
  }

  if (issue.context) {
    contextParts.push(`<span>Context: ${issue.context}</span>`);
  }

  const snippetHtml = issue.snippet ? `<div class="issue-snippet">${escapeHtml(issue.snippet)}</div>` : '';

  return `
    <div class="issue-item ${severity}">
      <div class="issue-icon">${icon}</div>
      <div class="issue-main">
        <span class="issue-rule">${escapeHtml(issue.rule)}</span>
        <div class="issue-message">${escapeHtml(issue.message)}</div>
        <div class="issue-location">${location}</div>
        ${contextParts.length > 0 ? `<div class="issue-context">${contextParts.join('')}</div>` : ''}
        ${snippetHtml}
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
