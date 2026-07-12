import { Node } from 'ts-morph';
import type { Issue, Rule, RuleOptions, Severity } from '../types/index.js';
import { hasChinese } from './utils/chinese.js';
import { createIssue, isWhitelisted } from './utils/issue.js';

export abstract class BaseRule implements Rule {
  abstract name: string;
  abstract description: string;
  defaultSeverity?: Severity = 'warning';

  protected abstract supportsNode(node: Node): boolean;
  protected abstract getNodeText(node: Node): string;
  protected abstract getNodeLocation(node: Node): Node;
  protected abstract getIssueMessage(text: string, node: Node): string;
  protected abstract getIssueType(node: Node): Issue['context'];

  async check(file: string, content: string, options: RuleOptions): Promise<Issue[]> {
    const issues: Issue[] = [];
    const sourceFile = options.sourceFile;

    if (!sourceFile) return issues;

    sourceFile.forEachDescendant((node) => {
      if (!this.supportsNode(node)) return;

      const text = this.getNodeText(node).trim();
      const location = this.getNodeLocation(node);

      if (
        !text ||
        !hasChinese(text) ||
        this.shouldSkipNode(node, options) ||
        isWhitelisted(text, options)
      ) {
        return;
      }

      issues.push(
        createIssue(
          this.name,
          file,
          content,
          location,
          this.getIssueMessage(text, node),
          this.getIssueType(node),
          options
        )
      );
    });

    return issues;
  }

  protected shouldSkipNode(_node: Node, _options: RuleOptions): boolean {
    void _node;
    void _options;
    return false;
  }
}
