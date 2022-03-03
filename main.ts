import chalk from 'chalk';
import process from 'process';

import linterPlugins, { Config, runLint } from './plugins';
import { AnyLinter, LinterOutput } from './api';
import { isNil } from './tools/util';
import { logAs, logExtraLine, getResultLevel } from './tools/logger';

// TODO: Load this from file
const config: Config = {
  rules: [
    {
      patterns: ['*.ts', '*.js', '*.tsx', '*.jsx', '*.json', '*.jsonc', '*.json5'],
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
    {
      patterns: ['.github/workflows/**.yml', '.github/actions/**.yml'],
      linterPlugin: 'actionlint',
    },
  ],
  defaultInstallStrategy: {
    strategy: 'installOrError',
    installationSourcePriority: ['brew', 'go', 'npm'],
  },
};

// TODO: Determine this based on CLI command
const scope = 'changed';

async function runApp() {
  const promises: Promise<LinterOutput | undefined>[] = [];
  logAs('info', `Using fileset scope "${scope}"`);
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
  }
  const summaryLevel = getResultLevel({ errorCount: totalErrorCount, warningCount: totalWarningCount });
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
