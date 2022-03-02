type MessageSeverity = 'warning' | 'error';

export interface Linter<S extends InstallationSource> {
  name: string;
  checkCommand: LinterCommandInterface;
  packageSources: SpecificPackageSources<S>;
}

export type AnyLinter = Linter<InstallationSource>;

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
  ruleIds: string[];
  message: string;
  contextUrl?: string;
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

export interface NpmPackage {
  packageName: string;
}

interface HomebrewPackage {
  taps?: string[];
  packageName: string;
}

interface GoPackage {
  packageUrl: string;
}

interface PackageSources {
  npm?: NpmPackage;
  brew?: HomebrewPackage;
  go?: GoPackage;
}

export type InstallationSource = keyof PackageSources;

type SpecificPackageSources<S extends InstallationSource> = Required<Pick<PackageSources, S>> & Record<string, unknown>;

interface InstallationStrategy<S extends InstallationSource> {
  // TODO: Add prompt options if in an interactive console?
  strategy: 'installOrError' | 'installOrSkip';
  installationSourcePriority: S[];
}

interface NotInstalledFailureStrategy {
  strategy: 'error' | 'skip';
}

export type NotInstalledStrategy<S extends InstallationSource> = InstallationStrategy<S> | NotInstalledFailureStrategy;

// TODO: Support multiple execution modes
// enum ExecutionMode {
//   DIRECT,
//   NIX_SHELL,
//   NPM_EXEC_LOCAL,
//   DENO_RUN,
// }
