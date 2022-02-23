import os from 'os';
import { FilesetScope } from "./api";
import exec from "./exec";

export async function gitChangedFiles(scope: FilesetScope, ...patterns: string[]): Promise<string[]> {
  const quotedPatterns = patterns.map(p => `"${p}"`)
  const hasPrefix = scope === 'changed';
  const baseCmd = scope === 'changed' ? ['git', 'status', '--porcelain=v1'] : ['git', 'ls-files', '-mo', '--exclude-standard'];
  const cmd = [...baseCmd, ...quotedPatterns];
  const childCommand = exec(cmd.join(' '));
  const {stdout} = await childCommand;
  let lines = stdout.split(os.EOL).filter(e => e.length > 0);
  if (hasPrefix) {
    lines = lines.map(l => l.substring(3));
  }
  return lines;
}
