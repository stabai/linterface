import { groupMessagesByFile } from '.';
import { getPosition, Linter, LinterMessage, LinterOutput } from '../api';
import { isNil } from '../tools/util';

const markdownlint: Linter<'brew' | 'npm'> = {
  name: 'markdownlint',
  packageSources: {
    brew: {
      packageName: 'markdownlint-cli',
    },
    npm: {
      packageName: 'markdownlint-cli',
    },
  },
  checkCommand: {
    commandBuilder: (filenames, _config, rule) => {
      const cmd: string[] = ['markdownlint', '--json'];
      if (!isNil(rule.configFilePath) && rule.configFilePath.length > 0) {
        cmd.push('--config', rule.configFilePath);
      }
      cmd.push(...filenames.map(f => `"${f}"`));
      return cmd.join(' ');
    },
    outputInterpreter: (processOutput): LinterOutput => {
      const output = JSON.parse(processOutput.stderr) as MarkdownlintJsonOutput;
      const messages = output.map((result): LinterMessage & { filePath: string } => {
        const errorRange = result.errorRange ?? [0, 0];
        return {
          filePath: result.fileName,
          ruleIds: result.ruleNames,
          severity: 'error',
          message: result.ruleDescription,
          contextUrl: result.ruleInformation,
          startPosition: getPosition(result.lineNumber, errorRange[0]),
          endPosition: getPosition(result.lineNumber, errorRange[0] + errorRange[1]),
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

export default markdownlint;

interface MarkdownlintJsonOutputMessage {
  fileName: string;
  lineNumber: number;
  ruleNames: string[];
  ruleDescription: string;
  ruleInformation: string;
  errorRange: [number, number];
}

type MarkdownlintJsonOutput = MarkdownlintJsonOutputMessage[];
