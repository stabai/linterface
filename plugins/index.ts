import chalk from 'chalk';
import { FilesetScope, Linter, LinterOutput, ProcessOutput } from '../api';
import exec, { ProcessException } from '../tools/exec';
import { gitChangedFiles } from '../tools/git';
import eslint from './eslint';

const linterPlugins = { eslint };

export type LinterPluginId = keyof typeof linterPlugins;

export default linterPlugins;

export async function runLint(scope: FilesetScope, linter: Linter, entry: ConfigEntry): Promise<LinterOutput> {
  console.log(`Running ${linter.name} for files matching: ${entry.patterns}`);
  const filenames = await gitChangedFiles(scope, ...entry.patterns);
  const checkCommand = linter.checkCommand.commandBuilder(filenames, entry.configFilePath);
  const process = exec(checkCommand);
  let result: ProcessOutput;
  try {
    result = {
      success: true,
      exitCode: process.child.exitCode ?? undefined,
      ...await process,
    };
  } catch (e) {
    const processError = e as ProcessException;
    result = {
      success: false,
      stdout: processError.stdout,
      stderr: processError.stderr,
      exitCode: processError.code,
    };
  }

  try {
    return linter.checkCommand.outputInterpreter(result);
  } catch (e) {
    console.error(`${chalk.bold.red('error')} Unable to interpret output from ${linter.name}:`);
    console.error(result);
    throw e;
  }
}

export interface ConfigEntry {
  linterPlugin: LinterPluginId;
  patterns: string[];
  configFilePath?: string;
}
