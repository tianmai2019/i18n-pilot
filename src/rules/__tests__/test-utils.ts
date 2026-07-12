import { Project } from 'ts-morph';
import type { Rule, RuleOptions } from '../../types/index.js';

export function createRuleOptions(
  file: string,
  code: string,
  overrides: Partial<RuleOptions> = {}
): RuleOptions {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(file, code);

  return {
    severity: 'warning',
    settings: {
      i18nCallees: ['t', '$t'],
      whitelist: [],
    },
    sourceFile,
    ...overrides,
    settings: {
      i18nCallees: ['t', '$t'],
      whitelist: [],
      ...overrides.settings,
    },
  };
}

export async function checkRule(
  rule: Rule,
  code: string,
  file = 'test.tsx',
  overrides: Partial<RuleOptions> = {}
) {
  return rule.check(file, code, createRuleOptions(file, code, overrides));
}
