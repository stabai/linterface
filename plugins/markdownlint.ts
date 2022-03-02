import { groupMessagesByFile } from '.';
import { Linter, LinterMessage, LinterOutput } from '../api';
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
    commandBuilder: (filenames, configFile) => {
      const cmd: string[] = ['markdownlint', '--json'];
      if (!isNil(configFile) && configFile?.length > 0) {
        cmd.push('--config', configFile);
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
          lineStart: result.lineNumber,
          columnStart: errorRange[0],
          lineEnd: result.lineNumber,
          columnEnd: errorRange[0] + errorRange[1],
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
