import { describe, expect, it } from 'vitest';
import jsxAttributes from '../jsx-attributes.js';
import { checkRule } from './test-utils.js';

describe('jsx-attributes rule', () => {
  it('detects JSX string attributes', async () => {
    const issues = await checkRule(jsxAttributes, 'const node = <input placeholder="请输入" />;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: 'jsx-attributes', context: 'jsx-attribute', line: 1 });
    expect(issues[0].message).toContain('placeholder');
  });

  it('detects JSX expression string attributes', async () => {
    const issues = await checkRule(jsxAttributes, "const node = <input placeholder={'请输入'} />;");

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('placeholder');
  });

  it('detects JSX expression template attributes', async () => {
    const issues = await checkRule(jsxAttributes, 'const node = <input title={`你好 ${user}`} />;');

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('title');
  });

  it('ignores structural and i18n component attributes', async () => {
    const issues = await checkRule(
      jsxAttributes,
      'const node = <><div className="欢迎" data-testid="提交按钮" key="保存" /><FormattedMessage id="welcome" defaultMessage="欢迎" /></>;'
    );

    expect(issues).toHaveLength(0);
  });
});
