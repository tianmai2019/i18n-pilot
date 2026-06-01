#!/usr/bin/env node
import cli from './cli.js';
(async () => {
    await cli.parseAsync(process.argv);
})();
