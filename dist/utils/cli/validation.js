export const VALID_RULE_LEVELS = new Set(['off', 'error', 'warning', 'info']);
export const VALID_OUTPUT_FORMATS = new Set(['stylish', 'compact']);
export function parseRuleConfig(entries = []) {
    const config = {};
    for (const entry of entries) {
        const [name, level] = entry.split('=');
        if (!name || !level || !VALID_RULE_LEVELS.has(level)) {
            throw new Error(`Invalid rule config "${entry}". Use name=off|error|warning|info.`);
        }
        config[name] = level;
    }
    return config;
}
export function parseOutputFormat(format) {
    const value = format ?? 'stylish';
    if (!VALID_OUTPUT_FORMATS.has(value)) {
        throw new Error(`Invalid format "${value}". Use stylish or compact.`);
    }
    return value;
}
