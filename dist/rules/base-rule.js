import { hasChinese } from './utils/chinese.js';
import { createIssue, isWhitelisted } from './utils/issue.js';
export class BaseRule {
    constructor() {
        this.defaultSeverity = 'warning';
    }
    async check(file, content, options) {
        const issues = [];
        const sourceFile = options.sourceFile;
        if (!sourceFile)
            return issues;
        sourceFile.forEachDescendant((node) => {
            if (!this.supportsNode(node))
                return;
            const text = this.getNodeText(node).trim();
            const location = this.getNodeLocation(node);
            if (!text ||
                !hasChinese(text) ||
                this.shouldSkipNode(node, options) ||
                isWhitelisted(text, options)) {
                return;
            }
            issues.push(createIssue(this.name, file, content, location, this.getIssueMessage(text, node), this.getIssueType(node), options));
        });
        return issues;
    }
    shouldSkipNode(_node, _options) {
        void _node;
        void _options;
        return false;
    }
}
