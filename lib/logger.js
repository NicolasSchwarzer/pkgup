'use strict';

const chalk = require('chalk').default;
const dayjs = require('dayjs');

const log = console.log; // eslint-disable-line no-console
const preMsg = () => `[${dayjs().format('YYYY-MM-DD HH:mm:ss.SSS')}] [pkgup]`;

module.exports = {
  /**
   * Log debug level messages.
   *
   * @param {string} msg Message to be logged.
   * @example
   *
   * const logger = require('pkg-update/lib/logger');
   * logger.debug('debug message');
   */
  debug(msg) {
    log(chalk.gray(`${preMsg()} ${msg}`));
  },

  /**
   * Log info level messages.
   *
   * @param {string} msg Message to be logged.
   * @example
   *
   * const logger = require('pkg-update/lib/logger');
   * logger.info('info message');
   */
  info(msg) {
    log(chalk.blueBright(preMsg()), msg);
  },

  /**
   * Log warn level messages.
   *
   * @param {string} msg Message to be logged.
   * @example
   *
   * const logger = require('pkg-update/lib/logger');
   * logger.warn('warn message');
   */
  warn(msg) {
    log(chalk.yellow(`${preMsg()} ${msg}`));
  },

  /**
   * Log error level messages.
   *
   * @param {string} msg Message to be logged.
   * @example
   *
   * const logger = require('pkg-update/lib/logger');
   * logger.error('error message');
   */
  error(msg) {
    log(chalk.redBright(`${preMsg()} ${msg}`));
  },

  /**
   * Log fatal level messages.
   *
   * @param {string} msg Message to be logged.
   * @example
   *
   * const logger = require('pkg-update/lib/logger');
   * logger.fatal('fatal message');
   */
  fatal(msg) {
    log(chalk.red(`${preMsg()} ${msg}`));
  },
};
