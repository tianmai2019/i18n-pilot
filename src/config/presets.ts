import type { Preset } from '../types/config.js';

export const presets: Record<string, Preset> = {
  recommended: {
    name: 'recommended',
    description: 'Balanced rules for most projects',
    rules: {
      'jsx-text': 'error',
      'jsx-attributes': 'warning',
      'template-literals': 'warning',
      'string-literals': 'info',
    },
    settings: {
      i18nCallees: ['t', '$t', 'i18n.t'],
    },
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
    extensions: ['ts', 'tsx', 'js', 'jsx'],
  },

  strict: {
    name: 'strict',
    description: 'Strict rules for projects that need full i18n coverage',
    rules: {
      'jsx-text': 'error',
      'jsx-attributes': 'error',
      'template-literals': 'error',
      'string-literals': 'error',
    },
    settings: {
      i18nCallees: ['t', '$t', 'i18n.t'],
    },
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
    extensions: ['ts', 'tsx', 'js', 'jsx'],
  },

  minimal: {
    name: 'minimal',
    description: 'Minimal rules for getting started',
    rules: {
      'jsx-text': 'warning',
      'jsx-attributes': 'off',
      'template-literals': 'off',
      'string-literals': 'off',
    },
    settings: {
      i18nCallees: ['t', '$t', 'i18n.t'],
    },
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
    extensions: ['ts', 'tsx', 'js', 'jsx'],
  },
};

export function getPreset(name: string): Preset {
  const preset = presets[name];
  if (!preset) {
    throw new Error(
      `Unknown preset "${name}". Available presets: ${Object.keys(presets).join(', ')}`
    );
  }
  return preset;
}
