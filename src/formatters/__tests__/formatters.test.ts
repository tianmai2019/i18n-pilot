import { describe, expect, it } from 'vitest';
import { formatCompact, formatStylish } from '../index.js';
import type { Issue } from '../../types/index.js';

const issue: Issue = {
  rule: 'jsx-text',
  severity: 'warning',
  message: 'Hardcoded Chinese in JSX text: "你好"',
  file: '/project/src/App.tsx',
  line: 12,
  column: 8,
  context: 'jsx-text',
  snippet: 'const node = <p>你好</p>;',
};

describe('formatters', () => {
  it('formats compact issues', () => {
    const output = formatCompact([issue], { targetPath: '/project' });

    expect(output).toBe('src/App.tsx:12:8: warning Hardcoded Chinese in JSX text: "你好" jsx-text');
  });

  it('formats stylish issues grouped by file', () => {
    const output = formatStylish([issue], { targetPath: '/project', color: false });

    expect(output).toContain('Issues:');
    expect(output).toContain('src/App.tsx');
    expect(output).toContain('[jsx-text]');
    expect(output).toContain('const node = <p>你好</p>;');
  });

  it('formats empty stylish results', () => {
    const output = formatStylish([], { targetPath: '/project', color: false });

    expect(output).toContain('No i18n issues found');
  });
});
