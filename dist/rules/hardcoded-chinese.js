import { Project, Node } from 'ts-morph';
const CHINESE_PATTERN = /[\u4e00-\u9fff]/;
function hasChinese(text) {
    return CHINESE_PATTERN.test(text);
}
const hardcodedChinese = {
    name: 'hardcoded-chinese',
    description: 'Detect hardcoded Chinese strings in source code',
    async check(file, content) {
        const issues = [];
        try {
            const project = new Project({ useInMemoryFileSystem: true });
            const sourceFile = project.createSourceFile(file, content);
            sourceFile.forEachDescendant((node) => {
                if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
                    const text = node.getLiteralText();
                    if (hasChinese(text)) {
                        issues.push({
                            rule: this.name,
                            severity: 'warning',
                            message: `Hardcoded Chinese string: "${text}"`,
                            file,
                            line: node.getStartLineNumber(),
                            column: node.getStartLinePos() + 1,
                            code: node.getText(),
                        });
                    }
                }
                if (Node.isJsxText(node)) {
                    const text = node.getText().trim();
                    if (hasChinese(text)) {
                        issues.push({
                            rule: this.name,
                            severity: 'warning',
                            message: `Hardcoded Chinese in JSX text: "${text}"`,
                            file,
                            line: node.getStartLineNumber(),
                            column: node.getStartLinePos() + 1,
                            code: text,
                        });
                    }
                }
            });
        }
        catch {
            for (const [i, line] of content.split('\n').entries()) {
                if (hasChinese(line)) {
                    issues.push({
                        rule: this.name,
                        severity: 'warning',
                        message: `Possible hardcoded Chinese: "${line.trim()}"`,
                        file,
                        line: i + 1,
                        code: line.trim(),
                    });
                }
            }
        }
        return issues;
    },
};
export default hardcodedChinese;
