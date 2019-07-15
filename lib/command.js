'use strict';

const yargs = require('yargs');
const inquirer = require('inquirer');
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
    const conf = await this.askForWhatUserWants();
    logger.info(JSON.stringify(argv));
    logger.info(JSON.stringify(conf));
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

  /**
   * Use command line interface to ask for what user wants to do.
   *
   * @returns {Promise<object>} A Promise of configuration that user defines.
   * @example
   *
   * const command = require('command');
   * command.askForWhatUserWants();
   * // => a Promise of configuration
   */
  async askForWhatUserWants() {
    // TODO
    const res = await inquirer.prompt({
      name: 'confirm',
      type: 'confirm',
      message: 'Continue?',
      default: true,
    });
    return res;
  },
};
