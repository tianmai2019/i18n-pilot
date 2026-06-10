import { describe, expect, it } from 'vitest';
import hardcodedChinese from '../hardcoded-chinese.js';
import { checkRule } from './test-utils.js';

async function check(code: string, file = 'test.tsx') {
  return checkRule(hardcodedChinese, code, file);
}

describe('hardcoded-chinese rule', () => {
  it('detects Chinese string literals', async () => {
    const issues = await check("const message = '欢迎使用';");

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'string', line: 1 });
    expect(issues[0].message).toContain('欢迎使用');
  });

  it('detects no-substitution template literals', async () => {
    const issues = await check('const message = `欢迎使用`;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'template', line: 1 });
  });

  it('detects template expressions with Chinese in the head', async () => {
    const issues = await check('const message = `欢迎 ${name}`;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'template', line: 1 });
    expect(issues[0].code).toContain('${name}');
  });

  it('detects template expressions with Chinese in the tail', async () => {
    const issues = await check('const message = `Hello ${name}，你好`;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'template', line: 1 });
  });

  it('detects JSX text', async () => {
    const issues = await check('const node = <p>你好</p>;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'jsx-text', line: 1 });
  });

  it('detects JSX string attributes', async () => {
    const issues = await check('const node = <input placeholder="请输入" />;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'jsx-attribute', line: 1 });
    expect(issues[0].message).toContain('placeholder');
  });

  it('detects JSX expression string attributes', async () => {
    const issues = await check("const node = <input placeholder={'请输入'} />;");

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'jsx-attribute', line: 1 });
  });

  it('detects JSX expression template attributes', async () => {
    const issues = await check('const node = <input title={`你好 ${user}`} />;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'jsx-attribute', line: 1 });
    expect(issues[0].message).toContain('title');
  });

  it('ignores bare t calls', async () => {
    const issues = await check("const message = t('欢迎');");

    expect(issues).toHaveLength(0);
  });

  it('ignores i18n.t calls', async () => {
    const issues = await check("const message = i18n.t('欢迎');");

    expect(issues).toHaveLength(0);
  });

  it('ignores this.$t calls', async () => {
    const issues = await check("const message = this.$t('欢迎');");

    expect(issues).toHaveLength(0);
  });

  it('ignores i18n template calls', async () => {
    const issues = await check('const message = t(`欢迎 ${name}`);');

    expect(issues).toHaveLength(0);
  });

  it('ignores Trans component content', async () => {
    const issues = await check('const node = <Trans i18nKey="welcome">欢迎</Trans>;');

    expect(issues).toHaveLength(0);
  });

  it('ignores FormattedMessage translation attributes', async () => {
    const issues = await check(
      'const node = <FormattedMessage id="welcome" defaultMessage="欢迎" />;'
    );

    expect(issues).toHaveLength(0);
  });

  it('ignores structural JSX attributes', async () => {
    const issues = await check(
      'const node = <div className="欢迎" data-testid="提交按钮" key="保存" />;'
    );

    expect(issues).toHaveLength(0);
  });

  it('ignores English-only files', async () => {
    const issues = await check("const message = 'hello'; const node = <button>Save</button>;");

    expect(issues).toHaveLength(0);
  });

  it('handles incomplete syntax without losing detected strings', async () => {
    const issues = await check("const message = '欢迎'\nfunction broken(");

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ context: 'string', line: 1 });
  });
});
