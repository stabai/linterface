import { groupMessagesByFile } from '.';
import { getPosition, Linter, LinterMessage, LinterOutput } from '../api';
import { isNil } from '../tools/util';

const actionlint: Linter<'brew' | 'go'> = {
  name: 'actionlint',
  packageSources: {
    go: { packageUrl: 'github.com/rhysd/actionlint/cmd/actionlint' },
    brew: { packageName: 'actionlint' },
  },
  checkCommand: {
    commandBuilder: (filenames, configFile) => {
      const cmd: string[] = ['actionlint', '-format \'{{json .}}\''];
      if (!isNil(configFile) && configFile?.length > 0) {
        cmd.push('-config-file', configFile);
      }
      cmd.push(...filenames.map(f => `'${f}'`));
      return cmd.join(' ');
    },
    outputInterpreter: (processOutput): LinterOutput => {
      const output = JSON.parse(processOutput.stdout) as ActionlintJsonOutput;
      const messages = output.map((result): LinterMessage & { filePath: string } => {
        return {
          filePath: result.filepath,
          message: result.message,
          severity: 'error',
          ruleIds: [result.kind],
          startPosition: getPosition(result.line, result.column),
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

export default actionlint;

interface ActionlintJsonOutputMessage {
  message: string;
  filepath: string;
  line?: number;
  column?: number;
  kind: string;
}

type ActionlintJsonOutput = ActionlintJsonOutputMessage[];
