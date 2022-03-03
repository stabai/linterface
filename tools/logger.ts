import chalk from 'chalk';

export const emphasisChalk = chalk.bold.blue;
export const successChalk = chalk.bold.green;
export const errorChalk = chalk.bold.red;
export const warningChalk = chalk.bold.yellow;

const levels = Object.freeze({
  'debug': { chalk, logger: console.debug },
  'info': { chalk: emphasisChalk, logger: console.info },
  'success': { chalk: successChalk, logger: console.info },
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

interface ResultSummary {
  errorCount: number;
  warningCount: number;
}

export function getResultLevel(summary: ResultSummary): LogLevel {
  if (summary.errorCount > 0) {
    return 'error';
  } else if (summary.warningCount > 0) {
    return 'warning';
  } else {
    return 'success';
  }
}
