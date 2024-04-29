export enum LogLevel {
  OFF = -1,
  ERROR,
  WARN,
  INFO,
  DEBUG,
  VERBOSE,
}

export type LoggerConfig = {
  level: LogLevel;
  verbose: boolean;
  traceDebug: boolean;
  traceVerbose: boolean;
};

export type Logger = {
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  verbose: (...args: unknown[]) => void;
  configure: (config: Partial<LoggerConfig>) => void;
  captureException?: (error: Error) => void;
};

const LOGGER_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  verbose: false,
  traceDebug: false,
  traceVerbose: false,
};

export const logger: Logger = {
  error: (...args: unknown[]) => {
    if (typeof logger.captureException === 'function') {
      logger.captureException(args[0] as Error);
    }

    if (LOGGER_CONFIG.level < LogLevel.ERROR) return;
    console.error(
      ...args.map((arg, i) => {
        if (typeof arg === 'string') {
          return i === 0 ? `❌  \x1b[31m${arg}\x1b[0m` : arg;
        }

        return arg;
      })
    );
  },
  warn: (...args: unknown[]) => {
    if (LOGGER_CONFIG.level < LogLevel.WARN) return;
    console.warn(
      ...args.map((arg, i) => {
        if (typeof arg === 'string') {
          return i === 0 ? `⚠️ \x1b[33m${arg}\x1b[0m` : arg;
        }

        return arg;
      })
    );
  },
  info: (...args: unknown[]) => {
    if (LOGGER_CONFIG.level < LogLevel.INFO) return;
    console.log(
      ...args.map((arg, i) => {
        if (typeof arg === 'string') {
          return i === 0 ? `ℹ️ \x1b[32m${arg}\x1b[0m` : arg;
        }

        return arg;
      })
    );
  },
  debug: (...args: unknown[]) => {
    if (LOGGER_CONFIG.level < LogLevel.DEBUG) return;
    (LOGGER_CONFIG.traceDebug ? console.trace : console.debug)(
      ...args.map((arg, i) => {
        if (typeof arg === 'string') {
          return i === 0 ? `🐞 \x1b[34m${arg}\x1b[0m` : arg;
        }

        return arg;
      })
    );
  },
  verbose: (...args: unknown[]) => {
    if (LOGGER_CONFIG.level < LogLevel.VERBOSE) return;
    (LOGGER_CONFIG.traceDebug ? console.trace : console.debug)(
      ...args.map((arg, i) => {
        if (typeof arg === 'string') {
          return i === 0 ? `🔍 \x1b[35m${arg}\x1b[0m` : arg;
        }

        return arg;
      })
    );
  },
  configure: (config: Partial<LoggerConfig>) => {
    Object.assign(LOGGER_CONFIG, config);
  },
};

export function infoColor(message: string) {
  return `\x1b[32m${message}\x1b[0m`;
}

export function warnColor(message: string) {
  return `\x1b[33m${message}\x1b[0m`;
}

export function errorColor(message: string) {
  return `\x1b[31m${message}\x1b[0m`;
}

export function debugColor(message: string) {
  return `\x1b[34m${message}\x1b[0m`;
}

export function verboseColor(message: string) {
  return `\x1b[35m${message}\x1b[0m`;
}

export function primaryColor(message: string) {
  return `\x1b[36m${message}\x1b[0m`;
}
