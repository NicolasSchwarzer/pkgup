'use strict';

const path = require('path');
const { fs, child_process: cp } = require('mz');
const yargs = require('yargs');
const inquirer = require('inquirer');
const ora = require('ora');
const archy = require('archy');
const color = require('ansicolors');
const semver = require('semver');
const logger = require('./logger');

const maxBuffer = 10 * 1024 * 1024; // Allow 10MB on exec stdout & stderr.

module.exports = {
  /**
   * Run command.
   *
   * @param {any[]} args Arguments to run command.
   * @returns {Promise<void>} A Promise of void.
   * @example
   *
   * const command = require('pkg-upgrade');
   * command.run(process.argv.slice(2));
   * // => a Promise of void
   */
  async run(args) {
    this.getParser().parse(args);
    const conf = await this.askForWhatUserWants();
    await this.runUpdateCheck(conf);
  },

  /**
   * Get argv parser.
   *
   * @returns {object} Instance of yargs.
   * @example
   *
   * const command = require('pkg-upgrade');
   * command.getParser();
   * // => yargs instance
   */
  getParser() {
    return yargs
      .usage('Figure out which packages\' dependencies should update.\nUsage: $0')
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
   * const command = require('pkg-upgrade');
   * command.getParserOptions();
   * // => yargs options
   */
  getParserOptions() {
    return {};
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
      message: 'Please make sure your project\'s \'node_modules\' are reliable, otherwise it\'s recommended to reinstall, should reinstall?',
      default: true,
    });

    // Reinstall node_modules if confirmed.
    if (shouldReinstall) {
      logger.info(`Reinstall 'node_modules' in ${projectDir}:`);
      const spinner = ora({ text: 'Reinstalling... Please wait a moment...', color: 'green' }).start();
      const startTime = Date.now();
      await cp.exec(
        `cd ${projectDir} && rm -rf node_modules && ${npmClient} install`,
        { maxBuffer },
      );
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
    // Use '|| true' to avoid peer dependency errors which will cause exit 1,
    // and do nothing with stderr output.
    let [res, err] = await cp.exec(
      `cd ${projectDir} && npm ls --parseable${isDev ? '' : ' --prod'} || true`,
      { maxBuffer },
    );
    spinner.stop();
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
        if (/node_modules/.test(value)) {
          return 'Invalid package name.';
        }
        if (!installedPkgs.includes(value)) {
          return `Package ${value} not found in dependencies${isDev ? ' or dev dependencies' : ''}.`;
        }
        return true;
      },
    });

    // Collect all versions of the package.
    logger.info(`Collect all versions of package ${pkgName}:`);
    spinner.start();
    [res, err] = await cp.exec(`npm view ${pkgName} versions --json`, { maxBuffer });
    spinner.stop();
    if (err) {
      throw new Error(err);
    }
    const versions = JSON.parse(res);
    logger.info('Collecting done.');

    // Ask for which version to update to.
    const { targetVersion } = await inquirer.prompt({
      name: 'targetVersion',
      type: 'list',
      message: `Please choose the version package ${pkgName} should update to:`,
      choices: [...versions].reverse(),
      pageSize: 15,
    });

    // Ask for since which version should update.
    const { minimumSourceVersion } = await inquirer.prompt({
      name: 'minimumSourceVersion',
      type: 'list',
      message: `Please choose the minimum version since which package ${pkgName} should update:`,
      choices: versions,
      pageSize: 15,
    });

    return {
      projectDir,
      isDev,
      pkgName,
      targetVersion,
      minimumSourceVersion,
    };
  },

  /**
   * Figure out which packages' dependencies should update and print.
   *
   * @param {object} conf The configuration user defines before running check.
   * @returns {Promise<void>} A Promise of void.
   * @example
   *
   * const command = require('pkg-upgrade');
   * command.runUpdateCheck(conf);
   * // => a Promise of void
   */
  async runUpdateCheck(conf) {
    const { projectDir, isDev, pkgName, targetVersion, minimumSourceVersion } = conf;
    logger.info('Start analyze:');
    const spinner = ora({ text: 'Analyzing...', color: 'green' }).start();
    const [res] = await cp.exec(
      `cd ${projectDir} && npm ls ${pkgName} --json${isDev ? '' : ' --prod'} || true`,
      { maxBuffer },
    );
    const pkgTree = JSON.parse(res);
    const outputTree = this.fromTree(pkgTree, pkgTree.name, pkgName, targetVersion, minimumSourceVersion);
    spinner.stop();
    if (outputTree) {
      logger.info('Analyzing done, below packages should update:');
      console.log('\n', archy(outputTree)); // eslint-disable-line no-console
    } else {
      logger.info('Analyzing done, no package needs to update.');
    }
  },

  /**
   * Generate a tree for archy to print.
   *
   * @param {object} pkgTree Original npm package tree.
   * @param {string} name Current tree root's package name.
   * @param {string} targetPkgName The target package name to update.
   * @param {string} targetVersion The target version to update.
   * @param {string} minimumSourceVersion The minimum version since which to udpate.
   * @returns {object} The tree for archy to print.
   * @example
   *
   * const command = require('pkg-upgrade');
   * command.fromTree(pkgTree, pkgTree.name, pkgName, targetVersion, minimumSourceVersion);
   * // => the tree for archy to print
   */
  fromTree(pkgTree, name, targetPkgName, targetVersion, minimumSourceVersion) {
    const { version, from, resolved, dependencies } = pkgTree;

    // Check version range's satisfaction of target package.
    if (name === targetPkgName && !semver.satisfies(version, `>=${minimumSourceVersion} <${targetVersion}`)) {
      return null;
    }

    // Assemble label.
    let label = `${name}${version ? `@${version}` : ''}`;
    if (from && !from.includes('@')) {
      label = `${label} (${resolved})`;
    }
    if (name === targetPkgName) {
      label = color.bgBlack(color.yellow(label));
    }

    // For non-leaf nodes, use depth first algorithm to generate the subtree.
    if (dependencies) {
      const tree = { label };
      const nodes = tree.nodes = [];
      Object.keys(dependencies).forEach((name) => {
        const subTree = this.fromTree(dependencies[name], name, targetPkgName, targetVersion, minimumSourceVersion);
        if (subTree) {
          nodes.push(subTree);
        }
      });
      if (nodes.length) {
        return tree;
      }
    }

    // For leaf nodes, just return label.
    if (name === targetPkgName) {
      return label;
    }
    return null;
  },
};
