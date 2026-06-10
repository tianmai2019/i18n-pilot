import { describe, expect, it } from 'vitest';
import stringLiterals from '../string-literals.js';
import { checkRule } from './test-utils.js';

describe('string-literals rule', () => {
  it('detects Chinese string literals', async () => {
    const issues = await checkRule(stringLiterals, "const message = '欢迎使用';");

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: 'string-literals', context: 'string', line: 1 });
  });

  it('ignores i18n calls', async () => {
    const issues = await checkRule(
      stringLiterals,
      "const a = t('欢迎'); const b = $t('保存'); const c = i18n.t('提交'); const d = this.$t('取消');"
    );

    expect(issues).toHaveLength(0);
  });

  it('does not report JSX attributes', async () => {
    const issues = await checkRule(stringLiterals, 'const node = <input placeholder="请输入" />;');

    expect(issues).toHaveLength(0);
  });

  it('applies exact whitelist', async () => {
    const issues = await checkRule(stringLiterals, "const brand = '欢迎使用';", 'test.ts', {
      settings: { i18nCallees: ['t', '$t'], whitelist: ['欢迎使用'] },
    });

    expect(issues).toHaveLength(0);
  });
});
