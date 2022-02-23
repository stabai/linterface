import { Linter, LinterFileResult, LinterMessage, LinterOutput } from "../api";

const eslint: Linter = {
  name: 'eslint',
  checkCommand: {
    commandBuilder: (filenames, configFile) => {
      const cmd: string[] = ['eslint', '--format', 'json'];
      if (configFile != null && configFile.length > 0) {
        cmd.push('--config', configFile)
      }
      cmd.push(...filenames.map(f => `"${f}"`))
      return cmd.join(' ');
    },
    outputInterpreter: (stdout): LinterOutput => {
      const output = JSON.parse(stdout) as EslintJsonOutput;
      const files = output.map((result): LinterFileResult => {
        const messages = result.messages.map((m): LinterMessage => ({
          ruleId: m.ruleId,
          severity: m.severity === 1 ? 'warning' : 'error',
          message: m.message,
          lineStart: m.line,
          columnStart: m.column,
          lineEnd: m.endLine,
          columnEnd: m.endColumn,
        }));
        return {
          filePath: result.filePath,
          messages,
          errorCount: result.errorCount,
          warningCount: result.warningCount,
          source: result.source,
        };
      });
      return {files};
    }
  },
};

export default eslint;

interface EslintJsonOutputMessage {
  ruleId: string;
  severity: 1|2;
  message: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

interface EslintJsonOutputFileResult {
  filePath: string;
  messages: EslintJsonOutputMessage[];
  errorCount: number;
  warningCount: number;
  source: string;
}

type EslintJsonOutput = EslintJsonOutputFileResult[];
