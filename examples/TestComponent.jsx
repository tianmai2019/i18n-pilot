import React from 'react';

export default function TestComponent() {
  const [count, setCount] = React.useState(0);
  const welcomeMessage = '欢迎使用 AI i18n 工具';
  const description = '这是一个用于国际化的自动化工具';
  const features = ['快速翻译', '准确上下文', '简单易用'];

  return (
    <div className="container">
      <h1>{welcomeMessage}</h1>
      <p>{description}</p>
      
      <div className="features">
        <h2>功能特点</h2>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="counter">
        <button onClick={() => setCount(count + 1)}>
          点击计数: {count}
        </button>
      </div>
      
      <footer>
        <p>© 2024 AI i18n 项目</p>
      </footer>
    </div>
  );
}
