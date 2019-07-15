#!/usr/bin/env node

'use strict';

const command = require('..');
const logger = require('../lib/logger');

command
  .run(process.argv.slice(2))
  .catch((err) => {
    logger.error(err.stack);
    process.exit(1);
  });
