import { BaseRule, Node, type RuleOptions } from './utils/index.js';
import {
  getJsxAttributeName,
  getTemplateLiteralText,
  isI18nComponentAttribute,
  isSkippedJsxAttribute,
} from './utils/ast.js';
import type { Issue } from '../types/index.js';

function getAttributeText(attribute: Node): { node: Node; text: string } | undefined {
  if (!Node.isJsxAttribute(attribute)) return undefined;

  const initializer = attribute.getInitializer();
  if (!initializer) return undefined;

  if (Node.isStringLiteral(initializer)) {
    return { node: initializer, text: initializer.getLiteralText() };
  }

  if (!Node.isJsxExpression(initializer)) return undefined;

  const expression = initializer.getExpression();
  if (!expression) return undefined;

  if (Node.isStringLiteral(expression)) {
    return { node: expression, text: expression.getLiteralText() };
  }

  if (Node.isNoSubstitutionTemplateLiteral(expression) || Node.isTemplateExpression(expression)) {
    return { node: expression, text: getTemplateLiteralText(expression) };
  }

  return undefined;
}

class JsxAttributesRule extends BaseRule {
  name = 'jsx-attributes';
  description = 'Detect hardcoded Chinese in JSX attributes';

  protected supportsNode(node: Node): boolean {
    return Node.isJsxAttribute(node);
  }

  protected getNodeText(node: Node): string {
    const attrValue = getAttributeText(node);
    return attrValue?.text ?? '';
  }

  protected getNodeLocation(node: Node): Node {
    const attrValue = getAttributeText(node);
    return attrValue?.node ?? node;
  }

  protected getIssueMessage(text: string, node: Node): string {
    const attrName = getJsxAttributeName(node);
    return `Hardcoded Chinese in JSX attribute "${attrName}": "${text}"`;
  }

  protected getIssueType(): Issue['context'] {
    return 'jsx-attribute';
  }

  protected shouldSkipNode(node: Node, _options: RuleOptions): boolean {
    void _options;
    const attrName = getJsxAttributeName(node);
    return isSkippedJsxAttribute(attrName) || isI18nComponentAttribute(node);
  }
}

export default new JsxAttributesRule();
