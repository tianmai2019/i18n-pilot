import type { Node } from 'ts-morph';
import type { Issue, RuleOptions } from '../../types/index.js';
import { getNodeContext } from './ast.js';

function getLine(content: string, line: number): string | undefined {
  return content.split('\n')[line - 1]?.trim();
}

export function isWhitelisted(text: string, options: RuleOptions): boolean {
  return options.settings.whitelist.includes(text);
}

export function createIssue(
  rule: string,
  file: string,
  content: string,
  node: Node,
  message: string,
  context: Issue['context'],
  options: RuleOptions,
  code = node.getText()
): Issue {
  const line = node.getStartLineNumber();
  const nodeContext = getNodeContext(node);

  return {
    rule,
    severity: options.severity,
    message,
    file,
    line,
    column: node.getStart() - node.getStartLinePos() + 1,
    code,
    context,
    snippet: getLine(content, line),
    ...nodeContext,
  };
}
