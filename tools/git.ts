import os from 'os';

import { FilesetScope } from '../api';
import exec from './exec';

export async function gitChangedFiles(scope: FilesetScope, ...patterns: string[]): Promise<string[]> {
  const quotedPatterns = patterns.map(p => `"${p}"`);
  const baseCmd =
    scope === 'changed'
      ? ['git', 'ls-files', '-mo', '--exclude-standard']
      : ['git', 'ls-files'];
  const cmd = [...baseCmd, ...quotedPatterns];
  const childCommand = exec(cmd.join(' '));
  const { stdout } = await childCommand;
  return stdout.split(os.EOL).filter(e => e.length > 0);
}
