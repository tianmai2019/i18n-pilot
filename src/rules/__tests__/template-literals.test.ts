import { describe, expect, it } from 'vitest';
import templateLiterals from '../template-literals.js';
import { checkRule } from './test-utils.js';

describe('template-literals rule', () => {
  it('detects no-substitution template literals', async () => {
    const issues = await checkRule(templateLiterals, 'const message = `欢迎使用`;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: 'template-literals', context: 'template', line: 1 });
  });

  it('detects template expressions', async () => {
    const issues = await checkRule(templateLiterals, 'const message = `欢迎 ${name}`;');

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('欢迎');
    expect(issues[0].code).toContain('${name}');
  });

  it('ignores i18n template calls', async () => {
    const issues = await checkRule(templateLiterals, 'const message = t(`欢迎 ${name}`);');

    expect(issues).toHaveLength(0);
  });

  it('does not report JSX attributes', async () => {
    const issues = await checkRule(
      templateLiterals,
      'const node = <input title={`你好 ${user}`} />;'
    );

    expect(issues).toHaveLength(0);
  });
});
