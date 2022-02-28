import os from 'os';
import { FilesetScope } from '../api';
import exec from './exec';

export async function gitChangedFiles(scope: FilesetScope, ...patterns: string[]): Promise<string[]> {
  const quotedPatterns = patterns.map(p => `"${p}"`);
  const baseCmd =
    scope === 'changed'
      ? ['git', 'status', '--porcelain=v1', '--untracked-files=all']
      : ['git', 'ls-files', '-mo', '--exclude-standard'];
  const hasPrefix = baseCmd[1] === 'status';
  const cmd = [...baseCmd, ...quotedPatterns];
  const childCommand = exec(cmd.join(' '));
  const { stdout } = await childCommand;
  let lines = stdout.split(os.EOL).filter(e => e.length > 0);
  if (hasPrefix) {
    lines = lines
      .filter(l => !l.substring(0, 2).includes('D')) // filter out deleted files
      .map(l => l.substring(3)); // remove status tags
  }
  return lines;
}
