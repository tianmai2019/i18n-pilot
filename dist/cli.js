import { Command } from 'commander';
const program = new Command();
program
    .name('i18n-pilot')
    .description('CLI for i18n-pilot')
    .version('0.0.1');
program
    .command('translate [text]')
    .description('Demo translate command (no real API call)')
    .action(async (text) => {
    console.log('Translate request:', text ?? '(no text)');
});
export default program;
