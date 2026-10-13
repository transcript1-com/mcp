#!/usr/bin/env node
'use strict';

// stdio bridge to the hosted transcript1 mcp server

const { spawn } = require('node:child_process');
const path = require('node:path');
const { buildArgs, buildEnv, resolveConfig } = require('../lib/bridge.js');

const getBinEntry = pkg => {
  if (typeof pkg.bin === 'string') {
    return pkg.bin;
  }

  return pkg.bin['mcp-remote'];
};

const config = resolveConfig(process.env);
if ('error' in config) {
  console.error(config.error);
  process.exit(1);
}

const mcpRemotePkg = require('mcp-remote/package.json');
const binEntry = getBinEntry(mcpRemotePkg);
const mcpRemoteBin = path.join(path.dirname(require.resolve('mcp-remote/package.json')), binEntry);

const child = spawn(
  process.execPath,
  buildArgs({ mcpRemoteBin, url: config.url, extraArgs: process.argv.slice(2) }),
  { stdio: 'inherit', env: buildEnv(process.env, config.token) },
);

child.on('exit', code => process.exit(code ?? 1));
child.on('error', error => {
  console.error(`transcript1-mcp: failed to start connector: ${error.message}`);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
