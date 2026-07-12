import { describe, expect, it } from 'vitest';
import jsxText from '../jsx-text.js';
import { checkRule } from './test-utils.js';

describe('jsx-text rule', () => {
  it('detects Chinese JSX text', async () => {
    const issues = await checkRule(jsxText, 'const node = <p>你好</p>;');

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ rule: 'jsx-text', context: 'jsx-text', line: 1 });
  });

  it('ignores English-only JSX text', async () => {
    const issues = await checkRule(jsxText, 'const node = <button>Save</button>;');

    expect(issues).toHaveLength(0);
  });

  it('ignores Trans component content', async () => {
    const issues = await checkRule(jsxText, 'const node = <Trans i18nKey="welcome">欢迎</Trans>;');

    expect(issues).toHaveLength(0);
  });

  it('adds component context for uppercase arrow functions', async () => {
    const issues = await checkRule(jsxText, 'const LoginPage = () => <p>登录</p>;');

    expect(issues[0]).toMatchObject({ component: 'LoginPage', functionName: 'LoginPage' });
  });
});
