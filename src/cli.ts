import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { Scanner } from './scanner.js';
import { formatIssues, formatResult } from './formatters/index.js';
import { RuleRegistry } from './rules/registry.js';
import { parseRuleConfig, parseOutputFormat } from './utils/cli/validation.js';
import { loadConfig, getDefaultConfig, listPresets, getPreset } from './config/index.js';
import type { OutputFormat, RuleConfig } from './types/index.js';

const program = new Command();

interface ScanCommandOptions {
  i18nignore?: boolean;
  ext?: string[];
  ignore?: string[];
  format?: string;
  rule?: string[];
  whitelist?: string[];
  preset?: string;
  config?: string;
  noConfig?: boolean;
}

program.name('i18n-pilot').description('CLI for i18n-pilot').version('0.0.1');

// Scan command
program
  .command('scan [path]')
  .description('Scan project for i18n issues')
  .option('--no-i18nignore', 'Disable .i18nignore support')
  .option('--ext <extensions...>', 'File extensions to scan (e.g., ts tsx js jsx)')
  .option('--ignore <patterns...>', 'Additional glob patterns to ignore')
  .option('--format <format>', 'Output format: stylish, compact, json, html, or sarif', 'stylish')
  .option('--rule <rules...>', 'Rule config entries (e.g., jsx-text=off string-literals=error)')
  .option('--whitelist <strings...>', 'Exact strings to ignore')
  .option('--preset <preset>', 'Use a preset configuration (recommended, strict, minimal)')
  .option('--config <path>', 'Path to config file')
  .option('--no-config', 'Disable config file loading')
  .action(async (scanPath: string | undefined, opts: ScanCommandOptions) => {
    let format: OutputFormat;
    let ruleConfig: RuleConfig;

    try {
      format = parseOutputFormat(opts.format);
      ruleConfig = parseRuleConfig(opts.rule);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(message));
      process.exitCode = 1;
      return;
    }

    const targetPath = path.resolve(scanPath || process.cwd());
    const isMachineFormat = format === 'json' || format === 'html' || format === 'sarif';

    if (!isMachineFormat) {
      console.log(chalk.bold('\n🔍 i18n-pilot scan'));
      console.log(chalk.gray(`   Scanning: ${targetPath}\n`));
    }

    const spinner = isMachineFormat
      ? null
      : ora({ text: 'Resolving files...', color: 'cyan' }).start();

    try {
      // Load config
      let config = getDefaultConfig();
      let configLoaded = false;
      let configSource = 'default preset';

      if (opts.noConfig !== true) {
        if (opts.config) {
          // TODO: Support explicit config path
          if (spinner) {
            spinner.info('Explicit config path not yet implemented, using default config');
          }
        } else {
          const loaded = await loadConfig(targetPath);
          if (loaded) {
            config = loaded;
            configLoaded = true;
            configSource = 'config file';
          }
        }
      } else {
        configSource = 'default preset (no config file)';
      }

      // Apply preset if specified (overrides config file)
      if (opts.preset) {
        try {
          const preset = getPreset(opts.preset);
          config.rules = preset.rules;
          config.settings = { ...config.settings, ...preset.settings };
          configSource = `${opts.preset} preset`;
          configLoaded = true;
        } catch (e) {
          if (spinner) {
            spinner.warn(`Preset "${opts.preset}" not found, using default`);
          }
        }
      }

      // Merge CLI options with config (CLI overrides everything)
      const finalWhitelist = [...config.whitelist, ...(opts.whitelist || [])];
      const finalExtensions = opts.ext || config.extensions;
      const finalIgnore = [...config.ignore, ...(opts.ignore || [])];
      const finalRules = { ...config.rules, ...ruleConfig };

      // Auto-discover all rules instead of manual registration
      const registry = await RuleRegistry.autoDiscover();
      const scanner = new Scanner(registry);

      let lastUpdate = 0;
      const result = await scanner.scan({
        targetPath,
        extensions: finalExtensions,
        ignorePatterns: finalIgnore,
        useI18nIgnore: opts.i18nignore !== false,
        ruleConfig: finalRules,
        whitelist: finalWhitelist,
        settings: config.settings,
        onProgress: (current, total, file) => {
          if (spinner) {
            const now = Date.now();
            if (now - lastUpdate > 50 || current === total) {
              lastUpdate = now;
              const shortFile = path.relative(targetPath, file);
              spinner.text = `Scanning [${current}/${total}] ${shortFile}`;
            }
          }
        },
      });

      if (spinner) {
        spinner.succeed(
          `Scan completed! Found ${result.issueCount} issues across ${result.fileCount} files`
        );

        console.log(chalk.gray(`   Using: ${configSource}`));

        if (result.ignoredCount > 0) {
          console.log(chalk.gray(`   Ignored ${result.ignoredCount} files`));
        }

        if (result.errors.length > 0) {
          console.log(chalk.yellow(`   Encountered ${result.errors.length} errors`));
        }
      }

      if (isMachineFormat) {
        console.log(formatResult(format, result, { targetPath }));
      } else if (result.issueCount > 0) {
        console.log('\n' + formatIssues(format, result.issues, { targetPath }));
      }

      process.exit(result.issueCount > 0 ? 1 : 0);
    } catch (err: unknown) {
      if (spinner) {
        spinner.fail('Scan failed');
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(message));
      process.exitCode = 1;
    }
  });

// Init command - to create a config file
program
  .command('init')
  .description('Initialize i18n-pilot configuration')
  .option('--preset <preset>', 'Use a preset configuration (recommended, strict, minimal)', 'recommended')
  .option('--force', 'Overwrite existing configuration file', false)
  .action(async (opts) => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { getPreset } = await import('./config/presets.js');

    console.log(chalk.bold('\n📝 i18n-pilot init'));
    console.log(chalk.gray(`   Preset: ${opts.preset}\n`));

    const configFile = path.resolve(process.cwd(), '.i18nrc.json');

    try {
      // Check if config exists
      const exists = await fs.stat(configFile).catch(() => null);
      if (exists && !opts.force) {
        console.error(chalk.red(`   Config file already exists at ${configFile}`));
        console.error(chalk.yellow('   Use --force to overwrite it.\n'));
        process.exitCode = 1;
        return;
      }

      // Get the preset
      const preset = getPreset(opts.preset);

      // Create config file
      const configContent = {
        extends: opts.preset,
        rules: preset.rules,
        ignore: ['node_modules/**', 'dist/**', 'build/**'],
        settings: {
          i18nCallees: ['t', '$t', 'i18n.t'],
        },
      };

      await fs.writeFile(configFile, JSON.stringify(configContent, null, 2));

      console.log(chalk.green(`   Created config file at ${configFile}`));
      console.log(chalk.gray(`   Using preset: ${opts.preset}\n`));

      // Also create an example ignore file
      const ignoreFile = path.resolve(process.cwd(), '.i18nignore');
      const ignoreExists = await fs.stat(ignoreFile).catch(() => null);
      if (!ignoreExists) {
        await fs.writeFile(
          ignoreFile,
          `# Files and directories to ignore for i18n-pilot
node_modules
dist
build
coverage
.git
.next
.cache

# Build artifacts
*.min.js
*.min.css

# Logs
*.log
npm-debug.log*
`
        );
        console.log(chalk.green(`   Created .i18nignore file\n`));
      }

      console.log(chalk.bold('   Next steps:'));
      console.log(chalk.gray('   1. Review the configuration file'));
      console.log(chalk.gray('   2. Run `i18n-pilot scan` to test the scan'));
      console.log(chalk.gray('   3. Fix any issues or ignore what you want\n'));
    } catch (err) {
      console.error(chalk.red(`   Failed to create config file: ${(err as Error).message}\n`));
      process.exitCode = 1;
    }
  });

// List presets command
program
  .command('presets')
  .description('List available presets')
  .action(() => {
    console.log(chalk.bold('\nAvailable presets:\n'));
    for (const preset of listPresets()) {
      console.log(`  ${chalk.cyan(preset.name)}`);
      console.log(`    ${preset.description}\n`);
    }
  });

export default program;
