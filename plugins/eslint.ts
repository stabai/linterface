import { Linter, LinterFileResult, LinterMessage, LinterOutput } from '../api';
import { isNil } from '../tools/util';

const eslint: Linter = {
  name: 'eslint',
  checkCommand: {
    commandBuilder: (filenames, configFile) => {
      const cmd: string[] = ['eslint', '--format', 'json'];
      if (!isNil(configFile) && configFile.length > 0) {
        cmd.push('--config', configFile);
      }
      cmd.push(...filenames.map(f => `"${f}"`));
      return cmd.join(' ');
    },
    outputInterpreter: (processOutput): LinterOutput => {
      const output = JSON.parse(processOutput.stdout) as EslintJsonOutput;
      let totalErrors = 0;
      let totalWarnings = 0;
      const files = output.map((result): LinterFileResult => {
        const messages = result.messages.map((m): LinterMessage => ({
          ruleIds: [m.ruleId],
          severity: m.severity === 1 ? 'warning' : 'error',
          message: m.message,
          lineStart: m.line,
          columnStart: m.column,
          lineEnd: m.endLine,
          columnEnd: m.endColumn,
        }));
        totalErrors += result.errorCount;
        totalWarnings += result.warningCount;
        return {
          filePath: result.filePath,
          messages,
          errorCount: result.errorCount,
          warningCount: result.warningCount,
          source: result.source,
        };
      });
      return {
        files,
        errorCount: totalErrors,
        warningCount: totalWarnings,
      };
    },
  },
};

export default eslint;

interface EslintJsonOutputMessage {
  ruleId: string;
  severity: 1 | 2;
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
