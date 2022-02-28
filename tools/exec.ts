import { promisify } from 'util';
import child_process, { ExecException } from 'child_process';

const exec = promisify(child_process.exec);
export default exec;

export type ProcessException = ExecException & {
  stdout: string;
  stderr: string;
};
