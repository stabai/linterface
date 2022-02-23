type MessageSeverity = 'warning' | 'error';

export interface Linter {
  name: string;
  checkCommand: LinterCommandInterface;
}

export interface LinterCommandInterface {
  commandBuilder: (filenames: string[], configFile?: string) => string,
  outputInterpreter: (processOutput: ProcessOutput) => LinterOutput,
}

export interface LinterOutput {
  files: LinterFileResult[];
  errorCount: number;
  warningCount: number;
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

export type FilesetScope = 'changed' | 'all';

export interface ProcessOutput {
  success: boolean;
  exitCode?: number;
  stdout: string;
  stderr: string;
}
