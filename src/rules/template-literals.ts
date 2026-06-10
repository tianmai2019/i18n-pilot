import { BaseRule, Node, type RuleOptions } from './utils/index.js';
import { getJsxAttribute, getTemplateLiteralText, isInsideI18nCall } from './utils/ast.js';
import type { Issue } from '../types/index.js';

class TemplateLiteralsRule extends BaseRule {
  name = 'template-literals';
  description = 'Detect hardcoded Chinese in template literals';

  protected supportsNode(node: Node): boolean {
    return Node.isNoSubstitutionTemplateLiteral(node) || Node.isTemplateExpression(node);
  }

  protected getNodeText(node: Node): string {
    return getTemplateLiteralText(node);
  }

  protected getNodeLocation(node: Node): Node {
    return node;
  }

  protected getIssueMessage(text: string): string {
    return `Hardcoded Chinese in template literal: "${text}"`;
  }

  protected getIssueType(): Issue['context'] {
    return 'template';
  }

  protected shouldSkipNode(node: Node, options: RuleOptions): boolean {
    return Boolean(getJsxAttribute(node)) || isInsideI18nCall(node, options.settings);
  }
}

export default new TemplateLiteralsRule();
