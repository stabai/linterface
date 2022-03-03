import {
  AnyLinter,
  FilesetScope,
  InstallationSource,
  LinterFileResult,
  LinterMessage,
  LinterOutput,
  NotInstalledStrategy,
  ProcessOutput,
} from '../api';
import exec, { ProcessException } from '../tools/exec';
import { gitChangedFiles } from '../tools/git';
import { getResultLevel, logAs, logExtraLine, logPrefixed } from '../tools/logger';
import { assertExhaustive, isNil, removeKey } from '../tools/util';
import actionlint from './actionlint';
import eslint from './eslint';
import golangcilint from './golangci-lint';
import markdownlint from './markdownlint';

const linterPlugins = { actionlint, eslint, golangcilint, markdownlint };

export type LinterPluginId = keyof typeof linterPlugins;

export default linterPlugins;

export async function runLint(
  scope: FilesetScope, linter: AnyLinter, entry: ConfigRule)
  : Promise<LinterOutput | undefined> {
  const filenames = await gitChangedFiles(scope, ...entry.patterns);

  logExtraLine();
  const checkCommand = linter.checkCommand.commandBuilder(filenames, entry.configFilePath);
  logAs('info', `Running ${linter.name} for files matching: ${entry.patterns.join(', ')}`);

  if (filenames.length === 0) {
    logAs('success', `No files to check with ${linter.name}!`);
    return undefined;
  } else {
    logAs('info', `Found files to check with ${linter.name}: [${filenames.join(', ')}]`);
  }

  logAs('debug', `$ ${checkCommand}`);
  const process = exec(checkCommand);
  let output: ProcessOutput;
  try {
    output = {
      success: true,
      exitCode: process.child.exitCode ?? undefined,
      ...await process,
    };
  } catch (e) {
    const processError = e as ProcessException;
    output = {
      success: false,
      stdout: processError.stdout,
      stderr: processError.stderr,
      exitCode: processError.code,
    };
  }

  try {
    let result: LinterOutput;
    if ((output.exitCode ?? 0) === 0 && output.stdout.length === 0 && output.stderr.length === 0) {
      result = {
        files: [],
        errorCount: 0,
        warningCount: 0,
      };
    } else {
      result = linter.checkCommand.outputInterpreter(output);
    }
    logLinterResults(linter, result);
    return result;
  } catch (e) {
    logPrefixed('error', `Unable to interpret output from ${linter.name}:`);
    console.error(output);
    throw e;
  }
}

export interface ConfigRule {
  linterPlugin: LinterPluginId;
  patterns: string[];
  configFilePath?: string;
}

export interface Config {
  rules: ConfigRule[];
  // TODO: Implement automatic installation
  defaultInstallStrategy?: NotInstalledStrategy<InstallationSource>;
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

function logLinterResults(linter: AnyLinter, result: LinterOutput) {
  for (const file of result.files) {
    if (file.errorCount + file.warningCount > 0) {
      const level = getResultLevel(file);
      logExtraLine();
      logAs(level, `File ${file.filePath} had ${file.errorCount} error(s) and ${file.warningCount} warning(s).`);
      for (const msg of file.messages) {
        logPrefixed(msg.severity, `line ${msg.lineStart}, col ${msg.columnStart} [${msg.ruleIds}]: ${msg.message}`);
      }
    }
  }
  const level = getResultLevel(result);
  logAs(level, `Linter ${linter.name} had ${result.errorCount} error(s) and ${result.warningCount} warning(s).`);
}
