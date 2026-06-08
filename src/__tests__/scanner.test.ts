import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Scanner } from '../scanner.js';
import type { Rule, Issue } from '../types/index.js';

let tmpDir: string;

async function touch(relativePath: string, content = '') {
  const fullPath = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
}

const mockRule: Rule = {
  name: 'mock-rule',
  description: 'A mock rule for testing',
  check: async (file: string, content: string): Promise<Issue[]> => {
    const issues: Issue[] = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('BAD')) {
        issues.push({
          rule: 'mock-rule',
          severity: 'error',
          message: `Found BAD on line ${i + 1}`,
          file,
          line: i + 1,
        });
      }
    }
    return issues;
  },
};

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'i18n-scanner-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('Scanner', () => {
  it('scans directory and returns issues', async () => {
    await touch('src/good.ts', 'const a = 1');
    await touch('src/bad.ts', 'const a = "BAD"');

    const scanner = new Scanner();
    scanner.addRule(mockRule);

    const result = await scanner.scan({ targetPath: tmpDir });

    expect(result.fileCount).toBe(2);
    expect(result.issueCount).toBe(1);
    expect(result.issues[0].message).toContain('BAD');
  });

  it('calls onProgress for each file', async () => {
    await touch('a.ts', 'const a = 1');
    await touch('b.ts', 'const b = 1');
    await touch('c.ts', 'const c = 1');

    const scanner = new Scanner();
    scanner.addRule(mockRule);

    const progressCalls: { current: number; total: number }[] = [];
    await scanner.scan({
      targetPath: tmpDir,
      onProgress: (current, total) => {
        progressCalls.push({ current, total });
      },
    });

    expect(progressCalls).toHaveLength(3);
    expect(progressCalls[0]).toEqual({ current: 1, total: 3 });
    expect(progressCalls[2]).toEqual({ current: 3, total: 3 });
  });

  it('collects errors from failing rules', async () => {
    await touch('ok.ts', 'const a = 1');

    const scanner = new Scanner();
    const failingRule: Rule = {
      name: 'failing-rule',
      description: 'Always throws',
      check: async () => {
        throw new Error('Parse error');
      },
    };
    scanner.addRule(failingRule);

    const result = await scanner.scan({ targetPath: tmpDir });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Parse error');
  });

  it('passes through ignoredCount and i18nIgnoreLoaded', async () => {
    await touch('src/index.ts', 'const a = 1');
    await touch('src/skip/me.ts', 'const a = 1');
    await touch('.i18nignore', 'src/skip/\n');

    const scanner = new Scanner();
    scanner.addRule(mockRule);

    const result = await scanner.scan({ targetPath: tmpDir, useI18nIgnore: true });

    expect(result.i18nIgnoreLoaded).toBe(true);
    expect(result.ignoredCount).toBe(1);
    expect(result.fileCount).toBe(1);
  });

  it('works with no rules registered', async () => {
    await touch('app.ts', 'const a = 1');

    const scanner = new Scanner();
    const result = await scanner.scan({ targetPath: tmpDir });

    expect(result.fileCount).toBe(1);
    expect(result.issueCount).toBe(0);
    expect(result.issues).toHaveLength(0);
  });

  it('applies multiple rules and aggregates issues', async () => {
    await touch('src/file.ts', 'BAD line here');

    const secondRule: Rule = {
      name: 'second-rule',
      description: 'Another rule',
      check: async (file) => [
        { rule: 'second-rule', severity: 'warning', message: 'Warning found', file, line: 1 },
      ],
    };

    const scanner = new Scanner();
    scanner.addRule(mockRule);
    scanner.addRule(secondRule);

    const result = await scanner.scan({ targetPath: tmpDir });

    expect(result.issueCount).toBe(2);
    const rules = result.issues.map((i) => i.rule).sort();
    expect(rules).toEqual(['mock-rule', 'second-rule']);
  });

  it('respects custom extensions', async () => {
    await touch('page.vue', '<template>BAD</template>');
    await touch('app.ts', 'const a = 1');

    const scanner = new Scanner();
    scanner.addRule(mockRule);

    const result = await scanner.scan({ targetPath: tmpDir, extensions: ['vue'] });

    expect(result.fileCount).toBe(1);
    expect(result.issueCount).toBe(1);
  });

  it('handles empty directory', async () => {
    const scanner = new Scanner();
    scanner.addRule(mockRule);

    const result = await scanner.scan({ targetPath: tmpDir });

    expect(result.fileCount).toBe(0);
    expect(result.issueCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
