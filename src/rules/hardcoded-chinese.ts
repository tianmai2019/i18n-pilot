import { Node, Project, SyntaxKind } from 'ts-morph';
import type { Issue, Rule } from '../types/index.js';

const CHINESE_PATTERN = /[一-鿿]/;
const I18N_CALLEES = new Set(['t', '$t']);
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

function hasChinese(text: string): boolean {
  return CHINESE_PATTERN.test(text);
}

function isSkippedJsxAttribute(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    SKIP_JSX_ATTRS.has(normalized) || normalized.startsWith('data-') || normalized.startsWith('on')
  );
}

function isI18nCallExpression(node: Node): boolean {
  if (!Node.isCallExpression(node)) return false;

  const expression = node.getExpression();
  if (Node.isIdentifier(expression)) {
    return I18N_CALLEES.has(expression.getText());
  }

  if (Node.isPropertyAccessExpression(expression)) {
    return I18N_CALLEES.has(expression.getName());
  }

  return false;
}

function isInsideI18nCall(node: Node): boolean {
  const call = node.getFirstAncestor((ancestor) => Node.isCallExpression(ancestor));
  return call ? isI18nCallExpression(call) : false;
}

function getJsxAttribute(node: Node): Node | undefined {
  return node.getFirstAncestor((ancestor) => Node.isJsxAttribute(ancestor));
}

function getJsxAttributeName(attribute: Node): string {
  return Node.isJsxAttribute(attribute) ? attribute.getNameNode().getText() : '';
}

function getJsxTagName(attribute: Node): string | undefined {
  const element = attribute.getFirstAncestor(
    (ancestor) => Node.isJsxOpeningElement(ancestor) || Node.isJsxSelfClosingElement(ancestor)
  );

  if (!element) return undefined;
  if (Node.isJsxOpeningElement(element) || Node.isJsxSelfClosingElement(element)) {
    return element.getTagNameNode().getText();
  }
  return undefined;
}

function isInsideTransComponent(node: Node): boolean {
  const jsxElement = node.getFirstAncestorByKind(SyntaxKind.JsxElement);
  if (!jsxElement) return false;

  const tagName = jsxElement.getOpeningElement().getTagNameNode().getText();
  return tagName === 'Trans';
}

function isI18nComponentAttribute(attribute: Node): boolean {
  const tagName = getJsxTagName(attribute);
  if (!tagName || !['Trans', 'FormattedMessage'].includes(tagName)) return false;

  const attrName = getJsxAttributeName(attribute).toLowerCase();
  return I18N_COMPONENT_ATTRS.has(attrName);
}

function getTemplateLiteralText(node: Node): string {
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

function createIssue(
  rule: string,
  file: string,
  node: Node,
  message: string,
  context: Issue['context'],
  code = node.getText()
): Issue {
  return {
    rule,
    severity: 'warning',
    message,
    file,
    line: node.getStartLineNumber(),
    column: node.getStartLinePos() + 1,
    code,
    context,
  };
}

const hardcodedChinese: Rule = {
  name: 'hardcoded-chinese',
  description: 'Detect hardcoded Chinese strings in source code',

  async check(file: string, content: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    try {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(file, content);

      sourceFile.forEachDescendant((node) => {
        if (Node.isStringLiteral(node)) {
          const text = node.getLiteralText();
          if (!hasChinese(text) || isInsideI18nCall(node)) return;

          const attribute = getJsxAttribute(node);
          if (attribute) {
            const attrName = getJsxAttributeName(attribute);
            if (isSkippedJsxAttribute(attrName) || isI18nComponentAttribute(attribute)) return;

            issues.push(
              createIssue(
                this.name,
                file,
                node,
                `Hardcoded Chinese in JSX attribute "${attrName}": "${text}"`,
                'jsx-attribute'
              )
            );
            return;
          }

          issues.push(
            createIssue(this.name, file, node, `Hardcoded Chinese string: "${text}"`, 'string')
          );
          return;
        }

        if (Node.isNoSubstitutionTemplateLiteral(node)) {
          const text = getTemplateLiteralText(node);
          if (!hasChinese(text) || isInsideI18nCall(node)) return;

          const attribute = getJsxAttribute(node);
          if (attribute) {
            const attrName = getJsxAttributeName(attribute);
            if (isSkippedJsxAttribute(attrName) || isI18nComponentAttribute(attribute)) return;

            issues.push(
              createIssue(
                this.name,
                file,
                node,
                `Hardcoded Chinese in JSX attribute "${attrName}": "${text}"`,
                'jsx-attribute'
              )
            );
            return;
          }

          issues.push(
            createIssue(
              this.name,
              file,
              node,
              `Hardcoded Chinese in template literal: "${text}"`,
              'template'
            )
          );
          return;
        }

        if (Node.isTemplateExpression(node)) {
          const text = getTemplateLiteralText(node);
          if (!hasChinese(text) || isInsideI18nCall(node)) return;

          const attribute = getJsxAttribute(node);
          if (attribute) {
            const attrName = getJsxAttributeName(attribute);
            if (isSkippedJsxAttribute(attrName) || isI18nComponentAttribute(attribute)) return;

            issues.push(
              createIssue(
                this.name,
                file,
                node,
                `Hardcoded Chinese in JSX attribute "${attrName}": "${text}"`,
                'jsx-attribute'
              )
            );
            return;
          }

          issues.push(
            createIssue(
              this.name,
              file,
              node,
              `Hardcoded Chinese in template literal: "${text}"`,
              'template'
            )
          );
          return;
        }

        if (Node.isJsxText(node)) {
          const text = node.getText().trim();
          if (!hasChinese(text) || isInsideTransComponent(node)) return;

          issues.push(
            createIssue(
              this.name,
              file,
              node,
              `Hardcoded Chinese in JSX text: "${text}"`,
              'jsx-text',
              text
            )
          );
        }
      });
    } catch {
      for (const [i, line] of content.split('\n').entries()) {
        if (hasChinese(line)) {
          issues.push({
            rule: this.name,
            severity: 'warning',
            message: `Possible hardcoded Chinese: "${line.trim()}"`,
            file,
            line: i + 1,
            code: line.trim(),
            context: 'fallback',
          });
        }
      }
    }

    return issues;
  },
};

export default hardcodedChinese;
