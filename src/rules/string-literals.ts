import { BaseRule, Node, type RuleOptions } from './utils/index.js';
import { getJsxAttribute, isInsideI18nCall } from './utils/ast.js';
import type { Issue } from '../types/index.js';

class StringLiteralsRule extends BaseRule {
  name = 'string-literals';
  description = 'Detect hardcoded Chinese in string literals';

  protected supportsNode(node: Node): boolean {
    return Node.isStringLiteral(node);
  }

  protected getNodeText(node: Node): string {
    return Node.isStringLiteral(node) ? node.getLiteralText() : '';
  }

  protected getNodeLocation(node: Node): Node {
    return node;
  }

  protected getIssueMessage(text: string): string {
    return `Hardcoded Chinese string: "${text}"`;
  }

  protected getIssueType(): Issue['context'] {
    return 'string';
  }

  protected shouldSkipNode(node: Node, options: RuleOptions): boolean {
    return Boolean(getJsxAttribute(node)) || isInsideI18nCall(node, options.settings);
  }
}

export default new StringLiteralsRule();
