// Test fixture for i18n-pilot Action E2E verification
// Contains intentional hardcoded Chinese text for the scanner to detect.
// DO NOT ship this file to production — it exists only to trigger the gate.

import * as React from 'react';

interface Props {
  onSubmit: () => void;
}

export function LoginForm({ onSubmit }: Props) {
  const errorMessage = '登录失败，请重试';

  return (
    <form onSubmit={onSubmit}>
      <h1>用户登录</h1>
      <label>
        用户名
        <input type="text" placeholder="请输入用户名" aria-label="用户名输入框" />
      </label>
      <label>
        密码
        <input type="password" placeholder="请输入密码" />
      </label>
      <button type="submit">登录</button>
      {errorMessage && <p className="error">{errorMessage}</p>}
    </form>
  );
}
