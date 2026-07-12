import fs from 'fs/promises';
import path from 'path';
import type { Config, ResolvedConfig } from '../types/config.js';
import type { RuleSettings, Severity } from '../types/index.js';
import { getPreset, presets } from './presets.js';

const CONFIG_FILES = ['.i18nrc.json', '.i18nrc', 'i18n.config.json', 'package.json'];

const DEFAULT_SETTINGS: RuleSettings = {
  i18nCallees: ['t', '$t', 'i18n.t'],
  whitelist: [],
};

const DEFAULT_IGNORE = ['node_modules/**', 'dist/**', 'build/**', '.git/**'];
const DEFAULT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];
const DEFAULT_SEVERITY: Severity = 'warning';

export async function loadConfig(startPath: string): Promise<ResolvedConfig | null> {
  const configPath = await findConfigFile(startPath);
  if (!configPath) {
    return null;
  }

  const config = await readConfigFile(configPath);
  return resolveConfig(config);
}

export async function findConfigFile(startPath: string): Promise<string | null> {
  let currentPath = path.resolve(startPath);
  const maxDepth = 50;
  let depth = 0;

  while (depth < maxDepth) {
    depth++;
    for (const file of CONFIG_FILES) {
      const filePath = path.join(currentPath, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          if (file === 'package.json') {
            const content = await fs.readFile(filePath, 'utf-8');
            const pkg = JSON.parse(content);
            if (pkg.i18nPilot || pkg['i18n-pilot']) {
              return filePath;
            }
          } else {
            return filePath;
          }
        }
      } catch {
        // File doesn't exist, continue
      }
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      // Reached root
      return null;
    }
    currentPath = parentPath;
  }
  return null;
}

async function readConfigFile(filePath: string): Promise<Config> {
  const content = await fs.readFile(filePath, 'utf-8');
  const filename = path.basename(filePath);

  if (filename === 'package.json') {
    const pkg = JSON.parse(content);
    return pkg.i18nPilot || pkg['i18n-pilot'] || {};
  }

  return JSON.parse(content);
}

export function resolveConfig(config: Config): ResolvedConfig {
  const resolved: ResolvedConfig = {
    rules: {},
    settings: { ...DEFAULT_SETTINGS },
    ignore: [...DEFAULT_IGNORE],
    extensions: [...DEFAULT_EXTENSIONS],
    whitelist: [],
    defaultSeverity: DEFAULT_SEVERITY,
  };

  // Apply presets first
  if (config.extends) {
    const presetNames = Array.isArray(config.extends) ? config.extends : [config.extends];
    for (const presetName of presetNames) {
      const preset = getPreset(presetName);
      Object.assign(resolved.rules, preset.rules);
      Object.assign(resolved.settings, preset.settings);
      resolved.ignore = [...new Set([...resolved.ignore, ...preset.ignore])];
      resolved.extensions = [...new Set([...resolved.extensions, ...preset.extensions])];
    }
  } else {
    // Default to recommended preset if no extends specified
    const recommended = getPreset('recommended');
    Object.assign(resolved.rules, recommended.rules);
    Object.assign(resolved.settings, recommended.settings);
  }

  // Override with user config
  if (config.rules) {
    Object.assign(resolved.rules, config.rules);
  }

  if (config.settings) {
    Object.assign(resolved.settings, config.settings);
  }

  if (config.ignore) {
    resolved.ignore = [...new Set([...resolved.ignore, ...config.ignore])];
  }

  if (config.extensions) {
    resolved.extensions = [...new Set([...resolved.extensions, ...config.extensions])];
  }

  if (config.whitelist) {
    resolved.whitelist = [...config.whitelist];
  }

  if (config.defaultSeverity) {
    resolved.defaultSeverity = config.defaultSeverity;
  }

  return resolved;
}

export function getDefaultConfig(): ResolvedConfig {
  const recommended = getPreset('recommended');
  return {
    rules: { ...recommended.rules },
    settings: { ...DEFAULT_SETTINGS, ...recommended.settings },
    ignore: [...DEFAULT_IGNORE],
    extensions: [...DEFAULT_EXTENSIONS],
    whitelist: [],
    defaultSeverity: DEFAULT_SEVERITY,
  };
}

export function listPresets(): Array<{ name: string; description: string }> {
  return Object.values(presets).map((p) => ({
    name: p.name,
    description: p.description,
  }));
}
