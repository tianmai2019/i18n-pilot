/**
 * i18n-pilot GitHub Action: PR comment builder
 *
 * Reads a JSON scan report and posts (or updates) a Markdown comment on the PR.
 * Uses a hidden HTML marker to identify the comment on subsequent runs.
 *
 * Invoked from action.yml via actions/github-script@v7:
 *
 *   const buildAndPost = require('./action/scripts/pr-comment.js');
 *   await buildAndPost({ github, context, core, jsonPath, scannedPaths });
 */

const fs = require('fs');
const path = require('path');

const COMMENT_MARKER = '<!-- i18n-pilot-comment:do-not-edit -->';
const MAX_INLINE_ISSUES = 10;

function buildCommentBody(report, scannedPaths) {
  const { result = {}, issues = [], summary = {} } = report;
  const issueCount = result.issueCount ?? 0;
  const fileCount = result.fileCount ?? 0;

  const lines = [
    COMMENT_MARKER,
    '## 🌐 i18n-pilot Report',
    '',
  ];

  if (issueCount === 0) {
    lines.push('✅ **No i18n issues found.**');
    lines.push('');
    lines.push(`- Files scanned: **${fileCount}**`);
    if (scannedPaths) {
      lines.push(`- Scope: \`${scannedPaths}\``);
    }
    return lines.join('\n');
  }

  lines.push(`⚠️ Found **${issueCount}** i18n issue${issueCount === 1 ? '' : 's'} in **${fileCount}** file${fileCount === 1 ? '' : 's'}.`);
  lines.push('');

  // Severity breakdown
  const bySeverity = summary.bySeverity || {};
  const severityKeys = Object.keys(bySeverity);
  if (severityKeys.length > 0) {
    lines.push('### By severity');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('| --- | ---: |');
    for (const sev of ['error', 'warning', 'info']) {
      if (bySeverity[sev]) {
        const icon = sev === 'error' ? '🔴' : sev === 'warning' ? '🟡' : '🔵';
        lines.push(`| ${icon} ${sev} | ${bySeverity[sev]} |`);
      }
    }
    lines.push('');
  }

  // Rule breakdown
  const byRule = summary.byRule || {};
  const ruleEntries = Object.entries(byRule).sort((a, b) => b[1] - a[1]);
  if (ruleEntries.length > 0) {
    lines.push('### By rule');
    lines.push('');
    lines.push('| Rule | Count |');
    lines.push('| --- | ---: |');
    for (const [rule, count] of ruleEntries) {
      lines.push(`| \`${rule}\` | ${count} |`);
    }
    lines.push('');
  }

  // Top offending files
  const byFile = summary.byFile || {};
  const fileEntries = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (fileEntries.length > 0) {
    lines.push('### Top files');
    lines.push('');
    lines.push('| File | Issues |');
    lines.push('| --- | ---: |');
    for (const [file, count] of fileEntries) {
      lines.push(`| \`${file}\` | ${count} |`);
    }
    lines.push('');
  }

  // Inline sample of first N issues
  if (issues.length > 0) {
    const sample = issues.slice(0, MAX_INLINE_ISSUES);
    lines.push('<details>');
    lines.push(`<summary>First ${sample.length} issue${sample.length === 1 ? '' : 's'}</summary>`);
    lines.push('');
    for (const iss of sample) {
      const loc = `${iss.file}:${iss.line}${iss.column ? ':' + iss.column : ''}`;
      const snippet = iss.snippet ? ` \`${iss.snippet.replace(/`/g, '\\`').slice(0, 80)}\`` : '';
      lines.push(`- **${iss.severity}** \`${iss.rule}\` — ${loc}${snippet}`);
    }
    if (issues.length > MAX_INLINE_ISSUES) {
      lines.push('');
      lines.push(`_...and ${issues.length - MAX_INLINE_ISSUES} more._ See the workflow logs or the uploaded SARIF report for details.`);
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  if (scannedPaths) {
    lines.push(`_Scope: \`${scannedPaths}\`_`);
  }

  return lines.join('\n');
}

async function findExistingComment(github, context) {
  const { owner, repo } = context.repo;
  const issue_number = context.payload.pull_request?.number ?? context.issue.number;

  const iterator = github.paginate.iterator(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100,
  });

  for await (const { data: comments } of iterator) {
    for (const c of comments) {
      if (c.body && c.body.includes(COMMENT_MARKER)) {
        return c;
      }
    }
  }
  return null;
}

async function buildAndPost({ github, context, core, jsonPath, scannedPaths }) {
  if (!context.payload.pull_request) {
    core.info('Not a pull_request event; skipping PR comment.');
    return;
  }

  const abs = path.resolve(jsonPath);
  if (!fs.existsSync(abs)) {
    core.warning(`JSON report not found at ${abs}; skipping PR comment.`);
    return;
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    core.warning(`Failed to parse JSON report: ${err.message}; skipping PR comment.`);
    return;
  }

  const body = buildCommentBody(report, scannedPaths);
  const { owner, repo } = context.repo;
  const issue_number = context.payload.pull_request.number;

  const existing = await findExistingComment(github, context);
  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    core.info(`Updated existing PR comment #${existing.id}`);
  } else {
    const created = await github.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
    core.info(`Created PR comment #${created.data.id}`);
  }
}

module.exports = buildAndPost;
// Attach helpers for unit testing
module.exports.buildCommentBody = buildCommentBody;
module.exports.COMMENT_MARKER = COMMENT_MARKER;
