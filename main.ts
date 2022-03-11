import chalk from 'chalk';
import process from 'process';

import linterPlugins, { Config, runLint } from './plugins';
import { AnyLinter, FilesetScope, LinterOutput } from './api';
import { isNil } from './tools/util';
import { getResultLevel, consoleLogger } from './tools/logger';

// TODO: Load this from file
const config: Config = {
  rules: [
    {
      patterns: ['*.ts', '*.js', '*.tsx', '*.jsx', '*.json', '*.jsonc', '*.json5'],
      linterPlugins: ['eslint'],
    },
    {
      patterns: ['*.md'],
      linterPlugins: ['markdownlint'],
    },
    {
      patterns: ['*.go'],
      linterPlugins: ['golangcilint'],
    },
    {
      patterns: ['example/**.proto'],
      linterPlugins: ['bufBreaking', 'bufLint'],
      params: {
        bufWorkspaceRoot: 'example',
      },
    },
    {
      patterns: ['.github/workflows/**.yml', '.github/actions/**.yml'],
      linterPlugins: ['actionlint'],
    },
  ],
  defaultInstallStrategy: {
    strategy: 'installOrError',
    installationSourcePriority: ['brew', 'go', 'npm'],
  },
};

// TODO: Determine this based on CLI command
const scope: FilesetScope = 'all';

async function runApp() {
  const promises: Promise<LinterOutput | undefined>[] = [];
  consoleLogger.logAs('info', `Using fileset scope "${scope}"`);
  for (const rule of config.rules) {
    for (const linterId of rule.linterPlugins) {
      const linter = linterPlugins[linterId];
      promises.push(runLint(scope, linter as AnyLinter, rule));
    }
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
  consoleLogger.logNewLine();
  consoleLogger.logAs(
    summaryLevel,
    `After all operations, there were ${totalErrorCount} error(s) and ${totalWarningCount} warning(s).`,
  );
  if (totalErrorCount > 0) {
    process.exit(1);
  }
}

runApp().catch(e => {
  consoleLogger.logNewLine();
  console.error(`${chalk.bold.red('error')} Linterface had a fatal error`);
  console.error(e);
  process.exit(e.exitCode ?? 1);
});
