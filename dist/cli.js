import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { Scanner } from './scanner.js';
import { formatIssues } from './formatters/index.js';
import { RuleRegistry } from './rules/registry.js';
import { parseRuleConfig, parseOutputFormat } from './utils/cli/validation.js';
const program = new Command();
program.name('i18n-pilot').description('CLI for i18n-pilot').version('0.0.1');
program
    .command('scan [path]')
    .description('Scan project for i18n issues')
    .option('--no-i18nignore', 'Disable .i18nignore support')
    .option('--ext <extensions...>', 'File extensions to scan (e.g., ts tsx js jsx)')
    .option('--ignore <patterns...>', 'Additional glob patterns to ignore')
    .option('--format <format>', 'Output format: stylish or compact', 'stylish')
    .option('--rule <rules...>', 'Rule config entries (e.g., jsx-text=off string-literals=error)')
    .option('--whitelist <strings...>', 'Exact strings to ignore')
    .action(async (scanPath, opts) => {
    let format;
    let ruleConfig;
    try {
        format = parseOutputFormat(opts.format);
        ruleConfig = parseRuleConfig(opts.rule);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(message));
        process.exitCode = 1;
        return;
    }
    const targetPath = path.resolve(scanPath || process.cwd());
    console.log(chalk.bold('\n🔍 i18n-pilot scan'));
    console.log(chalk.gray(`   Scanning: ${targetPath}\n`));
    const spinner = ora({ text: 'Resolving files...', color: 'cyan' }).start();
    try {
        // Auto-discover all rules instead of manual registration
        const registry = await RuleRegistry.autoDiscover();
        const scanner = new Scanner(registry);
        let lastUpdate = 0;
        const result = await scanner.scan({
            targetPath,
            extensions: opts.ext,
            ignorePatterns: opts.ignore,
            useI18nIgnore: opts.i18nignore !== false,
            ruleConfig,
            whitelist: opts.whitelist,
            onProgress: (current, total, file) => {
                const now = Date.now();
                if (now - lastUpdate > 50 || current === total) {
                    lastUpdate = now;
                    const shortFile = path.relative(targetPath, file) || file;
                    spinner.text = `Scanning [${current}/${total}] ${shortFile}`;
                }
            },
        });
        spinner.succeed(`Scan completed! Found ${result.issueCount} issues across ${result.fileCount} files`);
        if (result.ignoredCount > 0) {
            console.log(chalk.gray(`   Ignored ${result.ignoredCount} files`));
        }
        if (result.errors.length > 0) {
            console.log(chalk.yellow(`   Encountered ${result.errors.length} errors`));
        }
        if (result.issueCount > 0) {
            console.log('\n' + formatIssues(format, result.issues, { targetPath }));
        }
        process.exit(result.issueCount > 0 ? 1 : 0);
    }
    catch (err) {
        spinner.fail('Scan failed');
        const message = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(message));
        process.exitCode = 1;
    }
});
export default program;
