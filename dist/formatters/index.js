import { formatCompact } from './compact.js';
import { formatStylish } from './stylish.js';
export function formatIssues(format, issues, options) {
    if (format === 'compact') {
        return formatCompact(issues, options);
    }
    return formatStylish(issues, options);
}
export { formatCompact, formatStylish };
