import { BaseRule, Node } from './utils/index.js';
import { getJsxAttribute, getTemplateLiteralText, isInsideI18nCall } from './utils/ast.js';
class TemplateLiteralsRule extends BaseRule {
    constructor() {
        super(...arguments);
        this.name = 'template-literals';
        this.description = 'Detect hardcoded Chinese in template literals';
    }
    supportsNode(node) {
        return Node.isNoSubstitutionTemplateLiteral(node) || Node.isTemplateExpression(node);
    }
    getNodeText(node) {
        return getTemplateLiteralText(node);
    }
    getNodeLocation(node) {
        return node;
    }
    getIssueMessage(text) {
        return `Hardcoded Chinese in template literal: "${text}"`;
    }
    getIssueType() {
        return 'template';
    }
    shouldSkipNode(node, options) {
        return Boolean(getJsxAttribute(node)) || isInsideI18nCall(node, options.settings);
    }
}
export default new TemplateLiteralsRule();
