import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import ignore, { type Ignore } from 'ignore';

const DEFAULT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'];

const DEFAULT_IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'backup',
  'coverage',
  '.next',
  '.nuxt',
];

const DEFAULT_IGNORE_PATTERNS = [
  ...DEFAULT_IGNORE_DIRS.map((dir) => `**/${dir}/**`),
  '**/*.test.{ts,tsx,js,jsx}',
  '**/*.spec.{ts,tsx,js,jsx}',
  '**/*.d.ts',
];

export interface ResolveOptions {
  targetPath: string;
  extensions?: string[];
  ignorePatterns?: string[];
  useI18nIgnore?: boolean;
}

export interface ResolveResult {
  files: string[];
  ignoredCount: number;
  i18nIgnoreLoaded: boolean;
}

function buildGlobPatterns(extensions: string[]): string[] {
  if (extensions.length === 1) {
    return [`**/*.${extensions[0]}`];
  }
  return [`**/*.{${extensions.join(',')}}`];
}

async function loadI18nIgnore(rootDir: string): Promise<{ ig: Ignore | null; loaded: boolean }> {
  const ignoreFilePath = path.join(rootDir, '.i18nignore');
  try {
    const content = await fs.readFile(ignoreFilePath, 'utf-8');
    const ig = ignore().add(content);
    return { ig, loaded: true };
  } catch {
    return { ig: null, loaded: false };
  }
}

export async function resolveFiles(options: ResolveOptions): Promise<ResolveResult> {
  const {
    targetPath,
    extensions = DEFAULT_EXTENSIONS,
    ignorePatterns = [],
    useI18nIgnore = true,
  } = options;

  const absoluteTarget = path.resolve(targetPath);

  const stat = await fs.stat(absoluteTarget);
  if (stat.isFile()) {
    return { files: [absoluteTarget], ignoredCount: 0, i18nIgnoreLoaded: false };
  }

  const globPatterns = buildGlobPatterns(extensions);
  const allIgnorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...ignorePatterns];

  const matchedFiles = await fg(globPatterns, {
    cwd: absoluteTarget,
    ignore: allIgnorePatterns,
    absolute: false,
    dot: false,
    onlyFiles: true,
  });

  let ig: Ignore | null = null;
  let i18nIgnoreLoaded = false;
  if (useI18nIgnore) {
    const result = await loadI18nIgnore(absoluteTarget);
    ig = result.ig;
    i18nIgnoreLoaded = result.loaded;
  }

  const files: string[] = [];
  let ignoredCount = 0;

  for (const relativePath of matchedFiles) {
    if (ig && ig.ignores(relativePath)) {
      ignoredCount++;
      continue;
    }
    files.push(path.join(absoluteTarget, relativePath));
  }

  files.sort();

  return { files, ignoredCount, i18nIgnoreLoaded };
}

export const DEFAULTS = {
  EXTENSIONS: DEFAULT_EXTENSIONS,
  IGNORE_DIRS: DEFAULT_IGNORE_DIRS,
  IGNORE_PATTERNS: DEFAULT_IGNORE_PATTERNS,
} as const;
