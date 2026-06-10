import { BaseRule, Node } from './utils/index.js';
import { getJsxAttributeName, getTemplateLiteralText, isI18nComponentAttribute, isSkippedJsxAttribute, } from './utils/ast.js';
function getAttributeText(attribute) {
    if (!Node.isJsxAttribute(attribute))
        return undefined;
    const initializer = attribute.getInitializer();
    if (!initializer)
        return undefined;
    if (Node.isStringLiteral(initializer)) {
        return { node: initializer, text: initializer.getLiteralText() };
    }
    if (!Node.isJsxExpression(initializer))
        return undefined;
    const expression = initializer.getExpression();
    if (!expression)
        return undefined;
    if (Node.isStringLiteral(expression)) {
        return { node: expression, text: expression.getLiteralText() };
    }
    if (Node.isNoSubstitutionTemplateLiteral(expression) || Node.isTemplateExpression(expression)) {
        return { node: expression, text: getTemplateLiteralText(expression) };
    }
    return undefined;
}
class JsxAttributesRule extends BaseRule {
    constructor() {
        super(...arguments);
        this.name = 'jsx-attributes';
        this.description = 'Detect hardcoded Chinese in JSX attributes';
    }
    supportsNode(node) {
        return Node.isJsxAttribute(node);
    }
    getNodeText(node) {
        const attrValue = getAttributeText(node);
        return attrValue?.text ?? '';
    }
    getNodeLocation(node) {
        const attrValue = getAttributeText(node);
        return attrValue?.node ?? node;
    }
    getIssueMessage(text, node) {
        const attrName = getJsxAttributeName(node);
        return `Hardcoded Chinese in JSX attribute "${attrName}": "${text}"`;
    }
    getIssueType() {
        return 'jsx-attribute';
    }
    shouldSkipNode(node, _options) {
        void _options;
        const attrName = getJsxAttributeName(node);
        return isSkippedJsxAttribute(attrName) || isI18nComponentAttribute(node);
    }
}
export default new JsxAttributesRule();
