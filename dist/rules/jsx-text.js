import { BaseRule, Node } from './utils/index.js';
import { isInsideTransComponent } from './utils/ast.js';
class JsxTextRule extends BaseRule {
    constructor() {
        super(...arguments);
        this.name = 'jsx-text';
        this.description = 'Detect hardcoded Chinese in JSX text nodes';
    }
    supportsNode(node) {
        return Node.isJsxText(node);
    }
    getNodeText(node) {
        return node.getText();
    }
    getNodeLocation(node) {
        return node;
    }
    getIssueMessage(text) {
        return `Hardcoded Chinese in JSX text: "${text}"`;
    }
    getIssueType() {
        return 'jsx-text';
    }
    shouldSkipNode(node, _options) {
        void _options;
        return isInsideTransComponent(node);
    }
}
export default new JsxTextRule();
