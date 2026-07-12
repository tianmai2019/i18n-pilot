import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { resolveFiles, DEFAULTS } from '../file-resolver.js';

let tmpDir: string;

async function touch(relativePath: string, content = '') {
  const fullPath = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'i18n-pilot-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('resolveFiles', () => {
  it('finds files by default extensions', async () => {
    await touch('app.tsx', 'export default () => <div/>');
    await touch('utils.ts', 'export const x = 1');
    await touch('main.js', 'console.log(1)');
    await touch('comp.jsx', 'export default () => <div/>');
    await touch('readme.md', '# readme');

    const result = await resolveFiles({ targetPath: tmpDir });

    const basenames = result.files.map((f) => path.basename(f)).sort();
    expect(basenames).toEqual(['app.tsx', 'comp.jsx', 'main.js', 'utils.ts']);
    expect(result.files).toHaveLength(4);
  });

  it('excludes node_modules, .git, dist, build by default', async () => {
    await touch('src/index.ts', 'const a = 1');
    await touch('node_modules/pkg/index.ts', 'const a = 1');
    await touch('.git/objects/pack.ts', 'const a = 1');
    await touch('dist/bundle.js', 'const a = 1');
    await touch('build/output.ts', 'const a = 1');

    const result = await resolveFiles({ targetPath: tmpDir });

    const basenames = result.files.map((f) => path.relative(tmpDir, f));
    expect(basenames).toEqual([path.join('src', 'index.ts')]);
  });

  it('excludes test and spec files by default', async () => {
    await touch('app.tsx', 'const a = 1');
    await touch('app.test.tsx', 'test(() => {})');
    await touch('app.spec.tsx', 'test(() => {})');
    await touch('utils.test.ts', 'test(() => {})');

    const result = await resolveFiles({ targetPath: tmpDir });

    const basenames = result.files.map((f) => path.basename(f));
    expect(basenames).toEqual(['app.tsx']);
  });

  it('excludes .d.ts declaration files', async () => {
    await touch('app.ts', 'const a = 1');
    await touch('types.d.ts', 'declare module "x"');

    const result = await resolveFiles({ targetPath: tmpDir });

    expect(result.files).toHaveLength(1);
    expect(path.basename(result.files[0])).toBe('app.ts');
  });

  it('respects .i18nignore file', async () => {
    await touch('src/index.ts', 'const a = 1');
    await touch('src/legacy/old.ts', 'const a = 1');
    await touch('src/generated/auto.ts', 'const a = 1');
    await touch('.i18nignore', 'src/legacy/\nsrc/generated/\n');

    const result = await resolveFiles({ targetPath: tmpDir, useI18nIgnore: true });

    const relativePaths = result.files.map((f) => path.relative(tmpDir, f));
    expect(relativePaths).toEqual([path.join('src', 'index.ts')]);
    expect(result.ignoredCount).toBe(2);
    expect(result.i18nIgnoreLoaded).toBe(true);
  });

  it('skips .i18nignore when useI18nIgnore is false', async () => {
    await touch('src/index.ts', 'const a = 1');
    await touch('src/legacy/old.ts', 'const a = 1');
    await touch('.i18nignore', 'src/legacy/\n');

    const result = await resolveFiles({ targetPath: tmpDir, useI18nIgnore: false });

    const relativePaths = result.files.map((f) => path.relative(tmpDir, f)).sort();
    expect(relativePaths).toEqual([
      path.join('src', 'index.ts'),
      path.join('src', 'legacy', 'old.ts'),
    ]);
    expect(result.i18nIgnoreLoaded).toBe(false);
  });

  it('handles single file target', async () => {
    await touch('single.ts', 'const a = 1');

    const filePath = path.join(tmpDir, 'single.ts');
    const result = await resolveFiles({ targetPath: filePath });

    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toBe(filePath);
    expect(result.ignoredCount).toBe(0);
  });

  it('supports custom extensions', async () => {
    await touch('app.vue', '<template><div/></template>');
    await touch('page.svelte', '<script>let x = 1</script>');
    await touch('main.ts', 'const a = 1');

    const result = await resolveFiles({ targetPath: tmpDir, extensions: ['vue', 'svelte'] });

    const basenames = result.files.map((f) => path.basename(f)).sort();
    expect(basenames).toEqual(['app.vue', 'page.svelte']);
    expect(result.files).toHaveLength(2);
  });

  it('supports custom ignore patterns', async () => {
    await touch('src/index.ts', 'const a = 1');
    await touch('src/vendor/lib.ts', 'const a = 1');
    await touch('src/vendor/other.ts', 'const a = 1');

    const result = await resolveFiles({
      targetPath: tmpDir,
      ignorePatterns: ['**/vendor/**'],
    });

    const relativePaths = result.files.map((f) => path.relative(tmpDir, f));
    expect(relativePaths).toEqual([path.join('src', 'index.ts')]);
  });

  it('handles empty directory gracefully', async () => {
    const result = await resolveFiles({ targetPath: tmpDir });

    expect(result.files).toHaveLength(0);
    expect(result.ignoredCount).toBe(0);
  });

  it('handles .i18nignore with comment lines and blank lines', async () => {
    await touch('src/index.ts', 'const a = 1');
    await touch('src/temp/draft.ts', 'const a = 1');
    await touch('.i18nignore', '# This is a comment\n\nsrc/temp/\n');

    const result = await resolveFiles({ targetPath: tmpDir });

    const relativePaths = result.files.map((f) => path.relative(tmpDir, f));
    expect(relativePaths).toEqual([path.join('src', 'index.ts')]);
    expect(result.ignoredCount).toBe(1);
  });

  it('returns files sorted by path', async () => {
    await touch('c.ts', 'const c = 1');
    await touch('a.ts', 'const a = 1');
    await touch('b.ts', 'const b = 1');

    const result = await resolveFiles({ targetPath: tmpDir });

    const basenames = result.files.map((f) => path.basename(f));
    expect(basenames).toEqual(['a.ts', 'b.ts', 'c.ts']);
  });
});

describe('DEFAULTS', () => {
  it('exports expected default extensions', () => {
    expect(DEFAULTS.EXTENSIONS).toContain('ts');
    expect(DEFAULTS.EXTENSIONS).toContain('tsx');
    expect(DEFAULTS.EXTENSIONS).toContain('jsx');
    expect(DEFAULTS.EXTENSIONS).toContain('vue');
  });

  it('exports expected default ignore directories', () => {
    expect(DEFAULTS.IGNORE_DIRS).toContain('node_modules');
    expect(DEFAULTS.IGNORE_DIRS).toContain('.git');
    expect(DEFAULTS.IGNORE_DIRS).toContain('dist');
  });
});
