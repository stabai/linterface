import chalk from 'chalk';
import process from 'process';

import linterPlugins, { Config, runLint } from './plugins';
import { AnyLinter, LinterOutput } from './api';
import { isNil } from './tools/util';
import { logPrefixed, LogLevel, logAs, logExtraLine } from './tools/logger';

// TODO: Load this from file
const config: Config = {
  rules: [
    {
      patterns: ['*.ts', '*.js', '*.tsx', '*.jsx', '*.json'],
      linterPlugin: 'eslint',
    },
    {
      patterns: ['*.md'],
      linterPlugin: 'markdownlint',
    },
    {
      patterns: ['*.go'],
      linterPlugin: 'golangcilint',
    },
  ],
  defaultInstallStrategy: {
    strategy: 'installOrError',
    installationSourcePriority: ['go', 'npm', 'brew'],
  },
};

const verboseMode = false;

async function runApp() {
  const promises: Promise<LinterOutput | undefined>[] = [];
  for (const rule of config.rules) {
    const linter = linterPlugins[rule.linterPlugin];
    promises.push(runLint('changed', linter as AnyLinter, rule));
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
        const level = getResultLevel(file.errorCount, file.warningCount);
        logExtraLine();
        logAs(level, `File ${file.filePath} had ${file.errorCount} error(s) and ${file.warningCount} warning(s).`);
        for (const msg of file.messages) {
          logPrefixed(msg.severity, `line ${msg.lineStart}, col ${msg.columnStart} [${msg.ruleIds}]: ${msg.message}`);
        }
      }
    }
  }
  const summaryLevel = getResultLevel(totalErrorCount, totalWarningCount);
  logExtraLine();
  logAs(
    summaryLevel,
    `After all operations, there were ${totalErrorCount} error(s) and ${totalWarningCount} warning(s).`,
  );
  if (totalErrorCount > 0) {
    process.exit(1);
  }
}

runApp().catch(e => {
  logExtraLine();
  console.error(`${chalk.bold.red('error')} Linterface had a fatal error`);
  console.error(e);
  process.exit(e.exitCode ?? 1);
});

function getResultLevel(errorCount: number, warningCount: number): LogLevel {
  if (errorCount > 0) {
    return 'error';
  } else if (warningCount > 0) {
    return 'warning';
  } else {
    return 'info';
  }
}
