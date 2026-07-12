import type { RuleConfig, RuleSettings, Severity } from './index.js';

export type PresetName = 'recommended' | 'strict' | 'minimal';

export interface Config {
  extends?: PresetName | PresetName[];
  rules?: RuleConfig;
  settings?: Partial<RuleSettings>;
  ignore?: string[];
  extensions?: string[];
  whitelist?: string[];
  defaultSeverity?: Severity;
}

export interface ResolvedConfig {
  rules: RuleConfig;
  settings: RuleSettings;
  ignore: string[];
  extensions: string[];
  whitelist: string[];
  defaultSeverity: Severity;
}

export interface Preset {
  name: PresetName;
  rules: RuleConfig;
  settings: Partial<RuleSettings>;
  ignore: string[];
  extensions: string[];
  description: string;
}
