import { Node, SyntaxKind } from 'ts-morph';
import type { RuleSettings } from '../../types/index.js';

const SKIP_JSX_ATTRS = new Set([
  'key',
  'ref',
  'class',
  'classname',
  'style',
  'id',
  'name',
  'type',
  'htmlfor',
  'href',
  'src',
  'role',
  'aria-controls',
  'aria-labelledby',
  'aria-describedby',
]);

const I18N_COMPONENT_ATTRS = new Set(['i18nkey', 'id', 'defaultmessage', 'description']);

export function isSkippedJsxAttribute(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    SKIP_JSX_ATTRS.has(normalized) || normalized.startsWith('data-') || normalized.startsWith('on')
  );
}

function isI18nCallExpression(node: Node, settings: RuleSettings): boolean {
  if (!Node.isCallExpression(node)) return false;

  const callees = new Set(settings.i18nCallees);
  const expression = node.getExpression();
  if (Node.isIdentifier(expression)) {
    return callees.has(expression.getText());
  }

  if (Node.isPropertyAccessExpression(expression)) {
    return callees.has(expression.getName());
  }

  return false;
}

export function isInsideI18nCall(node: Node, settings: RuleSettings): boolean {
  const call = node.getFirstAncestor((ancestor) => Node.isCallExpression(ancestor));
  return call ? isI18nCallExpression(call, settings) : false;
}

export function getJsxAttribute(node: Node): Node | undefined {
  return node.getFirstAncestor((ancestor) => Node.isJsxAttribute(ancestor));
}

export function getJsxAttributeName(attribute: Node): string {
  return Node.isJsxAttribute(attribute) ? attribute.getNameNode().getText() : '';
}

export function getJsxTagName(attribute: Node): string | undefined {
  const element = attribute.getFirstAncestor(
    (ancestor) => Node.isJsxOpeningElement(ancestor) || Node.isJsxSelfClosingElement(ancestor)
  );

  if (!element) return undefined;
  if (Node.isJsxOpeningElement(element) || Node.isJsxSelfClosingElement(element)) {
    return element.getTagNameNode().getText();
  }
  return undefined;
}

export function isInsideTransComponent(node: Node): boolean {
  const jsxElement = node.getFirstAncestorByKind(SyntaxKind.JsxElement);
  if (!jsxElement) return false;

  const tagName = jsxElement.getOpeningElement().getTagNameNode().getText();
  return tagName === 'Trans';
}

export function isI18nComponentAttribute(attribute: Node): boolean {
  const tagName = getJsxTagName(attribute);
  if (!tagName || !['Trans', 'FormattedMessage'].includes(tagName)) return false;

  const attrName = getJsxAttributeName(attribute).toLowerCase();
  return I18N_COMPONENT_ATTRS.has(attrName);
}

export function getTemplateLiteralText(node: Node): string {
  if (Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralText();
  }

  if (Node.isTemplateExpression(node)) {
    const parts = [node.getHead().getLiteralText()];
    for (const span of node.getTemplateSpans()) {
      parts.push(span.getLiteral().getLiteralText());
    }
    return parts.join('');
  }

  return '';
}

function getVariableFunctionName(node: Node): string | undefined {
  const variableDeclaration = node.getFirstAncestor((ancestor) =>
    Node.isVariableDeclaration(ancestor)
  );
  if (!variableDeclaration || !Node.isVariableDeclaration(variableDeclaration)) return undefined;

  const initializer = variableDeclaration.getInitializer();
  if (!initializer) return undefined;
  if (!Node.isArrowFunction(initializer) && !Node.isFunctionExpression(initializer))
    return undefined;

  return variableDeclaration.getName();
}

export function getNodeContext(node: Node): { component?: string; functionName?: string } {
  const variableFunctionName = getVariableFunctionName(node);
  if (variableFunctionName) {
    return {
      functionName: variableFunctionName,
      component: /^[A-Z]/.test(variableFunctionName) ? variableFunctionName : undefined,
    };
  }

  const fn = node.getFirstAncestor(
    (ancestor) =>
      Node.isFunctionDeclaration(ancestor) ||
      Node.isFunctionExpression(ancestor) ||
      Node.isMethodDeclaration(ancestor)
  );

  if (fn) {
    if (Node.isFunctionDeclaration(fn) || Node.isFunctionExpression(fn)) {
      const name = fn.getName();
      if (name) {
        return { functionName: name, component: /^[A-Z]/.test(name) ? name : undefined };
      }
    }

    if (Node.isMethodDeclaration(fn)) {
      const classNode = fn.getFirstAncestor((ancestor) => Node.isClassDeclaration(ancestor));
      const className =
        classNode && Node.isClassDeclaration(classNode) ? classNode.getName() : undefined;
      return { functionName: fn.getName(), component: className };
    }
  }

  const classNode = node.getFirstAncestor((ancestor) => Node.isClassDeclaration(ancestor));
  if (classNode && Node.isClassDeclaration(classNode)) {
    return { component: classNode.getName() };
  }

  return {};
}
