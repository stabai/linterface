import { groupMessagesByFile } from '.';
import { Linter, LinterMessage, LinterOutput } from '../api';
import { isNil } from '../tools/util';

const golangcilint: Linter<'brew' | 'go'> = {
  name: 'golangci-lint',
  packageSources: {
    brew: {
      taps: ['golangci/tap'],
      packageName: 'golangci/tap/golangci-lint',
    },
    go: {
      packageUrl: 'github.com/golangci/golangci-lint/cmd/golangci-lint',
    },
  },
  checkCommand: {
    commandBuilder: (filenames, configFile) => {
      const cmd: string[] = ['golangci-lint', '--out-format', 'json', 'run'];
      if (!isNil(configFile) && configFile?.length > 0) {
        cmd.push('--config', configFile);
      }
      cmd.push(...filenames.map(f => `"${f}"`));
      return cmd.join(' ');
    },
    outputInterpreter: (processOutput): LinterOutput => {
      const output = JSON.parse(processOutput.stdout) as GolangcilintJsonOutput;
      const messages = output.Issues.map((result): LinterMessage & { filePath: string } => {
        const pos = result.Pos;
        const severity = result.Severity.toLowerCase() === 'warning' ? 'warning' : 'error';
        return {
          filePath: pos.Filename,
          ruleIds: [result.FromLinter],
          severity: severity,
          message: result.Text,
          lineStart: pos.Line,
          columnStart: pos.Column,
        };
      });
      return {
        files: groupMessagesByFile(messages),
        errorCount: messages.length,
        warningCount: 0,
      };
    },
  },
};

export default golangcilint;

interface GolangcilintJsonOutputMessage {
  FromLinter: string;
  Text: string;
  Severity: string;
  SourceLines: string[],
  Pos: GolangcilintJsonOutputPos,
}

interface GolangcilintJsonOutput {
  Issues: GolangcilintJsonOutputMessage[];
}

interface GolangcilintJsonOutputPos {
  Filename: string,
  Offset: number,
  Line: number,
  Column: number,
}
