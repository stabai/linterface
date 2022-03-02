import chalk from 'chalk';

export const emphasisChalk = chalk.bold.blue;
export const errorChalk = chalk.bold.red;
export const warningChalk = chalk.bold.yellow;

const levels = Object.freeze({
  'debug': { chalk, logger: console.debug },
  'info': { chalk: emphasisChalk, logger: console.info },
  'warning': { chalk: warningChalk, logger: console.warn },
  'error': { chalk: errorChalk, logger: console.error },
});

export type LogLevel = keyof typeof levels;

function colorize(level: LogLevel, message?: string): string {
  return level === 'debug' ? message ?? '' : levels[level].chalk(message ?? level);
}

export function logPrefixed(level: LogLevel, message: string): void {
  const prefix = colorize(level);
  const logger = levels[level].logger;
  const fragments = [prefix, message].filter(str => str.length > 0);
  logger(fragments.join(' '));
}

export function logAs(level: LogLevel, message: string): void {
  const logger = levels[level].logger;
  const colorized = colorize(level, message);
  logger(colorized);
}

export function logExtraLine(): void {
  console.log();
}
