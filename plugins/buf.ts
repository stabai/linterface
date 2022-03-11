import { groupMessagesByFile } from '.';
import { getPosition, Linter, LinterMessage, LinterOutput, MessageSeverity } from '../api';
import { isNil } from '../tools/util';

interface BufCommand {
  name: string;
  severity: MessageSeverity;
  commandName: string;
  extraCommandArgs?: string[];
}

function buf(command: BufCommand): Linter<'brew' | 'go'> {
  return {
    name: command.name,
    packageSources: {
      go: { packageUrl: 'github.com/bufbuild/buf/cmd/buf' },
      brew: {
        taps: ['bufbuild/buf'],
        packageName: 'buf',
      },
    },
    checkCommand: {
      commandBuilder: (filenames, configFile) => {
        const cmd: string[] = ['buf', command.commandName, '--error-format', 'json'];
        if (!isNil(command.extraCommandArgs)) {
          cmd.push(...command.extraCommandArgs);
        }
        cmd.push('example/proto'); // TODO: Remove this and pass in the target folder somehow
        if (!isNil(configFile) && configFile?.length > 0) {
          cmd.push('--config', configFile);
        }
        cmd.push(...filenames.map(f => `--path '${f}'`));
        return cmd.join(' ');
      },
      outputInterpreter: (processOutput): LinterOutput => {
        const output = processOutput.stdout
          .split('\n')
          .filter(it => it.length > 0)
          .map(it => JSON.parse(it) as BufLintJsonOutputMessage);
        const messages = output.map((result): LinterMessage & { filePath: string } => {
          return {
            filePath: result.path,
            message: result.message,
            severity: command.severity,
            ruleIds: [result.type],
            startPosition: getPosition(result.start_line, result.start_column),
            endPosition: getPosition(result.end_line, result.end_column),
          };
        });

        return {
          files: groupMessagesByFile(messages),
          errorCount: command.severity === 'error' ? messages.length : 0,
          warningCount: command.severity === 'warning' ? messages.length : 0,
        };
      },
    },
  };
}

export const bufLint = buf({
  name: 'buf lint',
  severity: 'warning',
  commandName: 'lint',
});

export const bufBreaking = buf({
  name: 'buf breaking',
  severity: 'error',
  commandName: 'breaking',
  extraCommandArgs: ['--against', '.git#branch=main'],
});

interface BufLintJsonOutputMessage {
  path: string;
  type: string;
  message: string;
  start_line?: number;
  start_column?: number;
  end_line?: number;
  end_column?: number;
}