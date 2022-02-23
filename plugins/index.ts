import { ConfigEntry, FilesetScope, Linter, LinterOutput } from "../api";
import exec from "../exec";
import { gitChangedFiles } from "../git";
import eslint from "./eslint";

const linterPlugins = {eslint};

export type LinterPluginId = keyof typeof linterPlugins;

export default linterPlugins;

export async function runLint(scope: FilesetScope, linter: Linter, entry: ConfigEntry): Promise<LinterOutput> {
  const filenames = await gitChangedFiles(scope, ...entry.patterns);
  const checkCommand = linter.checkCommand.commandBuilder(filenames, entry.configFilePath);
  let result = await exec(checkCommand);
  return linter.checkCommand.outputInterpreter(result.stdout, result.stderr);
}
