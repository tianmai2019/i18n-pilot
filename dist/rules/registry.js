import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
export class RuleRegistry {
    constructor() {
        this.rules = new Map();
    }
    register(rule) {
        if (this.rules.has(rule.name)) {
            throw new Error(`Rule "${rule.name}" is already registered`);
        }
        this.rules.set(rule.name, rule);
    }
    getAll() {
        return [...this.rules.values()];
    }
    resolve(config = {}) {
        const resolved = [];
        for (const rule of this.rules.values()) {
            const level = config[rule.name];
            if (level === 'off')
                continue;
            resolved.push({
                rule,
                severity: level ?? rule.defaultSeverity ?? 'warning',
            });
        }
        return resolved;
    }
    /**
     * Auto-discover and register all rules in the rules directory
     */
    static async autoDiscover(registry) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const rulesDir = __dirname;
        const instance = registry || new RuleRegistry();
        const files = await fs.readdir(rulesDir);
        for (const file of files) {
            // Skip test files, utils, and non-TS/JS files
            if (file.includes('__tests__') ||
                file.includes('utils') ||
                (!file.endsWith('.ts') && !file.endsWith('.js'))) {
                continue;
            }
            // Skip registry itself, base classes, and compatibility aggregate rules.
            if (file === 'registry.ts' ||
                file === 'registry.js' ||
                file === 'base-rule.ts' ||
                file === 'base-rule.js' ||
                file === 'hardcoded-chinese.ts' ||
                file === 'hardcoded-chinese.js') {
                continue;
            }
            try {
                const rulePath = path.join(rulesDir, file);
                const module = await import(pathToFileURL(rulePath).href);
                // Handle both default export and named exports
                const rule = module.default || module;
                if (rule && typeof rule === 'object' && rule.name && typeof rule.check === 'function') {
                    instance.register(rule);
                }
            }
            catch (err) {
                console.warn(`Failed to load rule ${file}:`, err);
            }
        }
        return instance;
    }
}
