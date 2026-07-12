import type { OutputFormat, RuleConfig, RuleLevel } from '../../types/index.js';

export const VALID_RULE_LEVELS = new Set<RuleLevel>(['off', 'error', 'warning', 'info']);
export const VALID_OUTPUT_FORMATS = new Set<OutputFormat>(['stylish', 'compact', 'json', 'html', 'sarif']);

export function parseRuleConfig(entries: string[] = []): RuleConfig {
  const config: RuleConfig = {};

  for (const entry of entries) {
    const [name, level] = entry.split('=');
    if (!name || !level || !VALID_RULE_LEVELS.has(level as RuleLevel)) {
      throw new Error(`Invalid rule config "${entry}". Use name=off|error|warning|info.`);
    }
    config[name] = level as RuleLevel;
  }

  return config;
}

export function parseOutputFormat(format: string | undefined): OutputFormat {
  const value = format ?? 'stylish';
  if (!VALID_OUTPUT_FORMATS.has(value as OutputFormat)) {
    throw new Error(`Invalid format "${value}". Use stylish, compact, json, html, or sarif.`);
  }
  return value as OutputFormat;
}
