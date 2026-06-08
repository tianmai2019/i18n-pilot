import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { Scanner } from './scanner.js';
import hardcodedChinese from './rules/hardcoded-chinese.js';
const program = new Command();
program.name('i18n-pilot').description('CLI for i18n-pilot').version('0.0.1');
program
    .command('scan [path]')
    .description('Scan project for i18n issues')
    .option('--no-i18nignore', 'Disable .i18nignore support')
    .option('--ext <extensions...>', 'File extensions to scan (e.g., ts tsx js jsx)')
    .option('--ignore <patterns...>', 'Additional glob patterns to ignore')
    .action(async (scanPath, opts) => {
    const targetPath = scanPath || process.cwd();
    console.log(chalk.bold('\n🔍 i18n-pilot scan'));
    console.log(chalk.gray(`   Scanning: ${targetPath}\n`));
    const spinner = ora({ text: 'Resolving files...', color: 'cyan' }).start();
    const scanner = new Scanner();
    scanner.addRule(hardcodedChinese);
    let lastUpdate = 0;
    const result = await scanner.scan({
        targetPath,
        extensions: opts.ext,
        ignorePatterns: opts.ignore,
        useI18nIgnore: opts.i18nignore !== false,
        onProgress: (current, total, file) => {
            const now = Date.now();
            if (now - lastUpdate > 50 || current === total) {
                lastUpdate = now;
                const shortFile = path.relative(targetPath, file) || file;
                spinner.text = `Scanning [${current}/${total}] ${shortFile}`;
            }
        },
    });
    spinner.succeed(`Scanned ${chalk.cyan(result.fileCount.toString())} files`);
    if (result.i18nIgnoreLoaded) {
        console.log(chalk.gray(`   .i18nignore loaded`));
    }
    if (result.ignoredCount > 0) {
        console.log(chalk.gray(`   ${result.ignoredCount} files ignored by .i18nignore`));
    }
    console.log(chalk.gray('─'.repeat(60)));
    console.log(`  Files scanned:  ${chalk.cyan(result.fileCount.toString())}`);
    console.log(`  Issues found:   ${chalk.yellow(result.issueCount.toString())}`);
    console.log(chalk.gray('─'.repeat(60)));
    if (result.issues.length > 0) {
        console.log('\n' + chalk.bold('Issues:\n'));
        const byFile = new Map();
        for (const issue of result.issues) {
            if (!byFile.has(issue.file))
                byFile.set(issue.file, []);
            byFile.get(issue.file).push(issue);
        }
        for (const [file, issues] of byFile) {
            const displayFile = path.relative(targetPath, file) || file;
            console.log(chalk.underline(displayFile));
            for (const issue of issues) {
                const severity = issue.severity === 'warning' ? chalk.yellow('⚠') : chalk.red('✖');
                const context = issue.context ? chalk.gray(`[${issue.context}] `) : '';
                console.log(`  ${severity} ${chalk.gray(`L${issue.line}`)}  ${context}${issue.message}`);
            }
            console.log();
        }
    }
    else {
        console.log(chalk.green('\n  ✓ No i18n issues found!\n'));
    }
    if (result.errors.length > 0) {
        console.log(chalk.red('\nErrors:'));
        for (const err of result.errors)
            console.log(`  ✖ ${err}`);
    }
});
export default program;
