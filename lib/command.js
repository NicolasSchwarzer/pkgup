'use strict';

const yargs = require('yargs');
const logger = require('./logger');

module.exports = {
  /**
   * Run command.
   *
   * @param {any[]} args Arguments to run command.
   * @returns {Promise<void>} A Promise of void.
   * @example
   *
   * const command = require('pkgup');
   * command.run(process.argv.slice(2));
   * // => a Promise of void
   */
  async run(args) {
    const argv = this.getParser().parse(args);
    logger.debug(JSON.stringify(argv));
  },

  /**
   * Get argv parser.
   *
   * @returns {object} Instance of yargs.
   * @example
   *
   * const command = require('pkgup');
   * command.getParser();
   * // => yargs instance
   */
  getParser() {
    return yargs
      .usage('Update packages\' dependencies.\nUsage: $0 --git-add')
      .options(this.getParserOptions())
      .alias('v', 'version')
      .alias('h', 'help')
      .version()
      .help();
  },

  /**
   * Get yargs options.
   *
   * @returns {object} Options of yargs.
   * @example
   *
   * const command = require('pkgup');
   * command.getParserOptions();
   * // => yargs options
   */
  getParserOptions() {
    return {
      'git-add': {
        type: 'boolean',
        description: 'stage packages\' dependencies\' changes',
        alias: 'a',
        default: false,
      },
    };
  },
};
