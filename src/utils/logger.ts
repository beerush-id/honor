import { type Log, logger as defaultLogger, LogLevel } from '@beerush/logger';
import { consoleAdapter, type ConsoleConfig, formatMessage } from '@beerush/logger/adapters/console';

export const logger = defaultLogger.create({
  tags: ['honor'],
});

const defaultConfig: ConsoleConfig = {
  level: LogLevel.VERBOSE,
  format: (log: Log) => formatMessage(log, false),
};

logger.use(consoleAdapter({ ...defaultConfig }));
