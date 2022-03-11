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

export interface Logger {
  logPrefixed(level: LogLevel, message: string): void;
  logAs(level: LogLevel, message: string): void;
  logNewLine(): void;
}

export const consoleLogger: Logger = Object.freeze({
  logPrefixed: (level: LogLevel, message: string): void => {
    const prefix = colorize(level);
    const logger = levels[level].logger;
    const fragments = [prefix, message].filter(str => str.length > 0);
    logger(fragments.join(' '));
  },
  logAs: (level: LogLevel, message: string): void => {
    const logger = levels[level].logger;
    const colorized = colorize(level, message);
    logger(colorized);
  },
  logNewLine: (): void => {
    console.log();
  },
});

type LogStatement = (logger: Logger) => void;

export class BufferedLogger implements Logger {
  private buffer = new Array<LogStatement>();

  public logPrefixed(level: LogLevel, message: string): void {
    this.buffer.push((l) => l.logPrefixed(level, message));
  }
  public logAs(level: LogLevel, message: string): void {
    this.buffer.push((l) => l.logAs(level, message));
  }
  public logNewLine(): void {
    this.buffer.push((l) => l.logNewLine());
  }

  public flushTo(logger: Logger): void {
    while (this.buffer.length > 0) {
      const statement = this.buffer.shift();
      if (statement == null) {
        break;
      }
      statement(logger);
    }
  }
  public flushToConsole(): void {
    this.flushTo(consoleLogger);
  }
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
