import chalk from 'chalk';
import { FilesetScope, Linter, LinterFileResult, LinterMessage, LinterOutput, ProcessOutput } from '../api';
import exec, { ProcessException } from '../tools/exec';
import { gitChangedFiles } from '../tools/git';
import { logAs, logExtraLine, logPrefixed } from '../tools/logger';
import { assertExhaustive, isNil, removeKey } from '../tools/util';
import eslint from './eslint';
import golangcilint from './golangci-lint';
import markdownlint from './markdownlint';

const linterPlugins = { eslint, golangcilint, markdownlint };

export type LinterPluginId = keyof typeof linterPlugins;

export default linterPlugins;

export async function runLint(
  scope: FilesetScope, linter: Linter, entry: ConfigEntry)
  : Promise<LinterOutput | undefined> {
  const filenames = await gitChangedFiles(scope, ...entry.patterns);
  if (filenames.length === 0) {
    return undefined;
  }

  const checkCommand = linter.checkCommand.commandBuilder(filenames, entry.configFilePath);
  const title = chalk.bold(`Running ${linter.name} for files matching: ${entry.patterns}`);
  logExtraLine();
  logAs('debug', `${title}\n$ ${checkCommand}`);
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
    if ((result.exitCode ?? 0) === 0 && result.stdout.length === 0 && result.stderr.length === 0) {
      return {
        files: [],
        errorCount: 0,
        warningCount: 0,
      };
    }
    return linter.checkCommand.outputInterpreter(result);
  } catch (e) {
    logPrefixed('error', `Unable to interpret output from ${linter.name}:`);
    console.error(result);
    throw e;
  }
}

export interface ConfigEntry {
  linterPlugin: LinterPluginId;
  patterns: string[];
  configFilePath?: string;
}

export function groupMessagesByFile(fileMessages: (LinterMessage & { filePath: string })[]): LinterFileResult[] {
  const fileMap = new Map<string, LinterFileResult>();
  for (const fileMsg of fileMessages) {
    const filePath = fileMsg.filePath;
    const msg = removeKey(fileMsg, 'filePath');
    let result = fileMap.get(filePath);
    if (!isNil(result)) {
      result.messages.push(msg);
    } else {
      result = {
        filePath: filePath,
        messages: [msg],
        errorCount: 0,
        warningCount: 0,
      };
      fileMap.set(filePath, result);
    }
    switch (msg.severity) {
      case 'error':
        result.errorCount++;
        break;
      case 'warning':
        result.warningCount++;
        break;
      default:
        assertExhaustive(msg.severity);
    }
  }
  return Array.from(fileMap.values());
}
