import { Command } from 'commander';
import chalk from 'chalk';
import { Scanner } from './scanner.js';
import hardcodedChinese from './rules/hardcoded-chinese.js';
const program = new Command();
program
    .name('i18n-pilot')
    .description('CLI for i18n-pilot')
    .version('0.0.1');
program
    .command('scan [path]')
    .description('Scan project for i18n issues')
    .action(async (scanPath) => {
    const targetPath = scanPath || process.cwd();
    console.log(chalk.bold('\n🔍 i18n-pilot scan'));
    console.log(chalk.gray(`   Scanning: ${targetPath}\n`));
    const scanner = new Scanner();
    scanner.addRule(hardcodedChinese);
    const result = await scanner.scanDirectory(targetPath);
    console.log(chalk.bold('Scan Results:'));
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
            console.log(chalk.underline(file));
            for (const issue of issues) {
                const severity = issue.severity === 'warning' ? chalk.yellow('⚠') : chalk.red('✖');
                console.log(`  ${severity} ${chalk.gray(`L${issue.line}`)}  ${issue.message}`);
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
