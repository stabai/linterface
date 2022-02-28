import chalk from 'chalk';
import process from 'process';
import linterPlugins, { ConfigEntry, runLint } from './plugins';
import { LinterOutput } from './api';
import { isNil } from './tools/util';

// TODO: Load this from file
const config: ConfigEntry[] = [
  {
    patterns: ['*.ts', '*.js', '*.tsx', '*.jsx', '*.json'],
    linterPlugin: 'eslint',
  },
  {
    patterns: ['*.md'],
    linterPlugin: 'markdownlint',
  },
];

const verboseMode = false;

async function runApp() {
  const promises: Promise<LinterOutput | undefined>[] = [];
  for (const entry of config) {
    const linter = linterPlugins[entry.linterPlugin];
    promises.push(runLint('changed', linter, entry));
  }
  const results = await Promise.all(promises);
  let totalErrorCount = 0;
  let totalWarningCount = 0;
  for (const result of results) {
    if (isNil(result)) {
      continue;
    }
    totalErrorCount += result.errorCount;
    totalWarningCount += result.warningCount;
    for (const file of result.files) {
      if (verboseMode || file.errorCount + file.warningCount > 0) {
        console.log(`${file.filePath} had ${file.errorCount} error(s) and ${file.warningCount} warning(s).`);
      }
    }
  }
  console.log();
  console.log(
    chalk.bold.blue('info')
    + ` After all operations, there were ${totalErrorCount} error(s) and ${totalWarningCount} warning(s).`);
  if (totalErrorCount > 0) {
    process.exit(1);
  }
}

runApp().catch(e => {
  console.log();
  console.error(`${chalk.bold.red('error')} Linterface had a fatal error`);
  console.error(e);
  process.exit(e.exitCode ?? 1);
});
