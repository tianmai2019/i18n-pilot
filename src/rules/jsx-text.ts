import { BaseRule, Node, type RuleOptions } from './utils/index.js';
import { isInsideTransComponent } from './utils/ast.js';
import type { Issue } from '../types/index.js';

class JsxTextRule extends BaseRule {
  name = 'jsx-text';
  description = 'Detect hardcoded Chinese in JSX text nodes';

  protected supportsNode(node: Node): boolean {
    return Node.isJsxText(node);
  }

  protected getNodeText(node: Node): string {
    return node.getText();
  }

  protected getNodeLocation(node: Node): Node {
    return node;
  }

  protected getIssueMessage(text: string): string {
    return `Hardcoded Chinese in JSX text: "${text}"`;
  }

  protected getIssueType(): Issue['context'] {
    return 'jsx-text';
  }

  protected shouldSkipNode(node: Node, _options: RuleOptions): boolean {
    void _options;
    return isInsideTransComponent(node);
  }
}

export default new JsxTextRule();
