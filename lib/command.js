'use strict';

const path = require('path');
const { fs, child_process: cp } = require('mz');
const yargs = require('yargs');
const inquirer = require('inquirer');
const ora = require('ora');
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
    // Ask for project directory.
    const { projectDir } = await inquirer.prompt({
      name: 'projectDir',
      type: 'input',
      message: 'Please input the absolute directory of your project:',
      transformer: value => value.trim(),
      async validate(value) {
        if (!path.isAbsolute(value)) {
          return 'You must provide an absolute directory.';
        }
        if (!await fs.exists(value)) {
          return 'Invalid, directory not found.';
        }
        const pkgPath = path.join(value, 'package.json');
        if (!await fs.exists(pkgPath)) {
          return 'Invalid, can\'t find package.json.';
        }
        try {
          require(pkgPath);
        } catch (err) {
          return 'Invalid, project package.json incorrect.';
        }
        return true;
      },
    });

    // Ask for npm client.
    const { npmClient } = await inquirer.prompt({
      name: 'npmClient',
      type: 'list',
      message: 'Please choose the npm client:',
      choices: ['npm', 'yarn'],
      default: 'npm',
    });

    // Ask for node_modules' reinstall.
    const { shouldReinstall } = await inquirer.prompt({
      name: 'shouldReinstall',
      type: 'confirm',
      message: 'For reliability, should \'node_modules\' be reinstalled?',
      default: true,
    });

    // Reinstall node_modules if confirmed.
    if (shouldReinstall) {
      logger.info(`Reinstall 'node_modules' in ${projectDir}:`);
      const spinner = ora({ text: 'Installing...', color: 'green' }).start();
      const startTime = Date.now();
      await cp.exec(`cd ${projectDir} && rm -rf node_modules && ${npmClient} install`);
      const duration = (Date.now() - startTime) / 1000;
      spinner.stop();
      logger.info(`Successfully reinstalled with ${duration}s spent.`);
    }

    // Ask for whether to consider dev dependencies.
    const { isDev } = await inquirer.prompt({
      name: 'isDev',
      type: 'confirm',
      message: 'Should also consider dev dependencies?',
      default: false,
    });

    // Collect all dependencies (and dev dependencies).
    logger.info(`Collect all dependencies${isDev ? ' and dev dependencies' : ''}:`);
    const spinner = ora({ text: 'Collecting...', color: 'green' }).start();
    const [res, err] = await cp.exec(`cd ${projectDir} && npm ls --parseable${isDev ? '' : ' --prod'}`);
    spinner.stop();
    if (err) {
      throw new Error(err);
    }
    const modulesPath = path.join(projectDir, 'node_modules/');
    const installedPkgs = res
      .split('\n')
      .slice(1)
      .map(value => value.replace(modulesPath, ''));
    logger.info('Collecting done.');

    // Ask for package name to update.
    const { pkgName } = await inquirer.prompt({
      name: 'pkgName',
      type: 'input',
      message: 'Please input the name of the package to update:',
      transformer: value => value.trim(),
      validate(value) {
        if (!value) {
          return 'You must provide a package name.';
        }
        if (!installedPkgs.includes(value)) {
          return `Package ${value} not found in dependencies${isDev ? ' or dev dependencies' : ''}.`;
        }
        return true;
      },
    });

    return {
      projectDir,
      npmClient,
      isDev,
      pkgName,
    };
  },
};
