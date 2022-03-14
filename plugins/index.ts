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
import { BufferedLogger, getResultLevel, Logger } from '../tools/logger';
import { assertExhaustive, isNil, removeKey } from '../tools/util';
import actionlint from './actionlint';
import { bufBreaking, bufLint } from './buf';
import eslint from './eslint';
import golangcilint from './golangci-lint';
import markdownlint from './markdownlint';

const linterPlugins = { actionlint, bufBreaking, bufLint, eslint, golangcilint, markdownlint };

export type LinterPluginId = keyof typeof linterPlugins;

export default linterPlugins;

export async function runLint(
  scope: FilesetScope, linter: AnyLinter, config: Config, entry: ConfigRule)
  : Promise<LinterOutput | undefined> {
  const filenames = await gitChangedFiles(scope, ...entry.patterns);
  const logger = new BufferedLogger();

  logger.logNewLine();
  const checkCommand = linter.checkCommand.commandBuilder(filenames, config, entry);
  logger.logAs('info', `Running ${linter.name} for files matching: ${entry.patterns.join(', ')}`);

  if (filenames.length === 0) {
    logger.logAs('success', `No files to check with ${linter.name}!`);
    return undefined;
  } else {
    logger.logAs('info', `Found files to check with ${linter.name}: [${filenames.join(', ')}]`);
  }

  logger.logAs('debug', `$ ${checkCommand}`);
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
    logLinterResults(linter, result, logger);
    return result;
  } catch (e) {
    logger.logPrefixed('error', `Unable to interpret output from ${linter.name}:`);
    logger.logAs('error', String(output));
    throw e;
  } finally {
    logger.flushToConsole();
  }
}

export interface BufParams {
  bufWorkspaceRoot?: string;
}

export interface ConfigRule {
  linterPlugins: LinterPluginId[];
  patterns: string[];
  configFilePath?: string;
  bufParams?: BufParams;
}

export interface GlobalParams {
  mainGitBranch?: string;
}

export interface Config {
  rules: ConfigRule[];
  globalParams?: GlobalParams;
  // TODO: Implement automatic installation
  defaultInstallStrategy?: NotInstalledStrategy<InstallationSource>;
}

const bufParamsPlugins: LinterPluginId[] = ['bufLint', 'bufBreaking'];

export function validateConfig(config: Config): Config {
  for (const rule of config.rules) {
    if (rule.bufParams != null && rule.linterPlugins.filter(l => bufParamsPlugins.includes(l)).length === 0) {
      throw new Error('Specifying bufParams in forbidden unless the lint rule includes bufLint and/or bufBreaking');
    }
  }
  return config;
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

function logLinterResults(linter: AnyLinter, result: LinterOutput, logger: Logger) {
  for (const file of result.files) {
    if (file.errorCount + file.warningCount > 0) {
      const level = getResultLevel(file);
      logger.logNewLine();
      logger.logAs(level, `File ${file.filePath} had ${file.errorCount} error(s) and ${file.warningCount} warning(s).`);
      for (const msg of file.messages) {
        const position =
          !isNil(msg.startPosition) ? `line ${msg.startPosition.line}, col ${msg.startPosition.column} ` : '';
        logger.logPrefixed(msg.severity, `${position}[${msg.ruleIds}]: ${msg.message}`);
      }
    }
  }
  const level = getResultLevel(result);
  logger.logAs(level, `Linter ${linter.name} had ${result.errorCount} error(s) and ${result.warningCount} warning(s).`);
}
