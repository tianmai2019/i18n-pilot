import { getNodeContext } from './ast.js';
function getLine(content, line) {
    return content.split('\n')[line - 1]?.trim();
}
export function isWhitelisted(text, options) {
    return options.settings.whitelist.includes(text);
}
export function createIssue(rule, file, content, node, message, context, options, code = node.getText()) {
    const line = node.getStartLineNumber();
    const nodeContext = getNodeContext(node);
    return {
        rule,
        severity: options.severity,
        message,
        file,
        line,
        column: node.getStart() - node.getStartLinePos() + 1,
        code,
        context,
        snippet: getLine(content, line),
        ...nodeContext,
    };
}
