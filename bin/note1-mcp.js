#!/usr/bin/env node
'use strict';

// stdio bridge to the hosted note1 mcp server

const { spawn } = require('node:child_process');
const path = require('node:path');

const SERVER_URL = 'https://api.note1.ai/mcp';

const getBinEntry = pkg => {
  if (typeof pkg.bin === 'string') {
    return pkg.bin;
  }

  return pkg.bin['mcp-remote'];
};

const token = process.env.NOTE1_API_TOKEN;
if (!token) {
  console.error(
    [
      'note1-mcp: missing NOTE1_API_TOKEN.',
      '',
      'Create a Personal Access Token at https://note1.ai -> Account -> API tokens,',
      'then set it in your MCP client config, e.g. for Claude Desktop:',
      '',
      '  {',
      '    "mcpServers": {',
      '      "note1": {',
      '        "command": "npx",',
      '        "args": ["-y", "@note1ai/mcp"],',
      '        "env": { "NOTE1_API_TOKEN": "n1_..." }',
      '      }',
      '    }',
      '  }',
    ].join('\n'),
  );
  process.exit(1);
}

const mcpRemotePkg = require('mcp-remote/package.json');
const binEntry = getBinEntry(mcpRemotePkg);
const mcpRemoteBin = path.join(path.dirname(require.resolve('mcp-remote/package.json')), binEntry);

const child = spawn(
  process.execPath,
  [mcpRemoteBin, SERVER_URL, '--header', `Authorization: Bearer ${token}`, ...process.argv.slice(2)],
  { stdio: 'inherit' },
);

child.on('exit', code => process.exit(code ?? 1));
child.on('error', error => {
  console.error(`note1-mcp: failed to start connector: ${error.message}`);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
