import { LinterPluginId } from "./plugins";

type MessageSeverity = 'warning'|'error';

export interface Linter {
  name: string;
  checkCommand: LinterCommandInterface;
}

export interface LinterCommandInterface {
  commandBuilder: (filenames: string[], configFile?: string) => string,
  outputInterpreter: (stdout: string, stderr: string) => LinterOutput,
}

export interface LinterOutput {
  files: LinterFileResult[];
}

export interface LinterMessage {
  ruleId: string;
  message: string;
  severity: MessageSeverity,
  lineStart: number;
  columnStart: number;
  lineEnd?: number;
  columnEnd?: number;
}

export interface LinterFileResult {
  filePath: string;
  messages: LinterMessage[];
  errorCount: number;
  warningCount: number;
  source?: string;
}

export type FilesetScope = 'changed'|'all';

export interface ConfigEntry {
  linterPlugin: LinterPluginId;
  patterns: string[];
  configFilePath?: string;
}
