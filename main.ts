import linterPlugins, { runLint } from './plugins';
import { ConfigEntry, LinterOutput } from './api';

const config: ConfigEntry[] = [
  {
    patterns: ["*.ts", "*.js", "*.tsx", "*.jsx"],
    linterPlugin: "eslint",
  },
  {
    patterns: ["*.json"],
    linterPlugin: "eslint",
  },
];

async function runApp() {
  const promises: Promise<LinterOutput>[] = [];
  for (const entry of config) {
    const linter = linterPlugins[entry.linterPlugin];
    promises.push(runLint('changed', linter, entry));
  }
  const results = await Promise.all(promises);
  results.forEach(r => console.log(r));
}

runApp().catch(e => console.error(`Fatal Linterface error: ${e}`));
