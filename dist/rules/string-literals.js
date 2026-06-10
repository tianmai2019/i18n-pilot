import { BaseRule, Node } from './utils/index.js';
import { getJsxAttribute, isInsideI18nCall } from './utils/ast.js';
class StringLiteralsRule extends BaseRule {
    constructor() {
        super(...arguments);
        this.name = 'string-literals';
        this.description = 'Detect hardcoded Chinese in string literals';
    }
    supportsNode(node) {
        return Node.isStringLiteral(node);
    }
    getNodeText(node) {
        return Node.isStringLiteral(node) ? node.getLiteralText() : '';
    }
    getNodeLocation(node) {
        return node;
    }
    getIssueMessage(text) {
        return `Hardcoded Chinese string: "${text}"`;
    }
    getIssueType() {
        return 'string';
    }
    shouldSkipNode(node, options) {
        return Boolean(getJsxAttribute(node)) || isInsideI18nCall(node, options.settings);
    }
}
export default new StringLiteralsRule();
