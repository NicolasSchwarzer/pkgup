'use strict';

const yargs = require('yargs');
const chalk = require('chalk');
const log = require('./log');

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
    log(chalk.red(JSON.stringify(argv)));
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
      .version()
      .help();
    // TODO version & help alias
  },

  // TODO
  // getParserOptions() {
  //   return {
  //     'git-add': {
  //       type: 'boolean',
  //     },
  //   };
  // },
};
