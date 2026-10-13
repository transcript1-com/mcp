const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { DEFAULT_SERVER_URL, buildArgs, resolveConfig } = require('../lib/bridge.js');

const root = path.join(__dirname, '..');

test('defaults to the hosted transcript1 server', () => {
  const config = resolveConfig({ TRANSCRIPT1_API_KEY: 't1_abc' });
  assert.deepEqual(config, { token: 't1_abc', url: 'https://api.transcript1.com/mcp' });
});

test('honors TRANSCRIPT1_MCP_URL for local servers', () => {
  const config = resolveConfig({ TRANSCRIPT1_API_KEY: 't1_abc', TRANSCRIPT1_MCP_URL: 'http://127.0.0.1:3000/mcp' });
  assert.deepEqual(config, { token: 't1_abc', url: 'http://127.0.0.1:3000/mcp' });
});

test('explains how to get a key when it is missing', () => {
  const { error } = resolveConfig({});
  assert.match(error, /missing TRANSCRIPT1_API_KEY/);
  assert.match(error, /https:\/\/transcript1\.com\/dashboard\/account\/tokens/);
  assert.match(error, /"args": \["-y", "@transcript1\/mcp"\]/);
});

test('rejects keys that are not transcript1 API keys', () => {
  const { error } = resolveConfig({ TRANSCRIPT1_API_KEY: 'n1_old' });
  assert.equal(error, 'transcript1-mcp: TRANSCRIPT1_API_KEY must be a transcript1 API key (t1_...).');
});

test('rejects plain-http remote URLs', () => {
  const { error } = resolveConfig({ TRANSCRIPT1_API_KEY: 't1_abc', TRANSCRIPT1_MCP_URL: 'http://evil.example/mcp' });
  assert.equal(error, 'transcript1-mcp: TRANSCRIPT1_MCP_URL must use https.');
});

test('passes the bearer header and extra arguments to mcp-remote', () => {
  const args = buildArgs({ mcpRemoteBin: '/x/proxy.js', url: DEFAULT_SERVER_URL, token: 't1_abc', extraArgs: ['--debug'] });
  assert.deepEqual(args, ['/x/proxy.js', 'https://api.transcript1.com/mcp', '--header', 'Authorization: Bearer t1_abc', '--debug']);
});

test('the bin exits 1 with help when the key is missing', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'bin/transcript1-mcp.js')], {
    env: {
      PATH: process.env.PATH,
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing TRANSCRIPT1_API_KEY/);
});

test('the package is branded transcript1 and cannot be published by accident', () => {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.name, '@transcript1/mcp');
  assert.equal(pkg.private, true);
  assert.deepEqual(pkg.bin, { 'transcript1-mcp': 'bin/transcript1-mcp.js' });
  assert.equal(pkg.mcpName, 'com.transcript1/mcp');
  for (const file of ['package.json', 'package-lock.json', 'README.md', 'LICENSE', 'bin/transcript1-mcp.js', 'lib/bridge.js']) {
    assert.doesNotMatch(readFileSync(path.join(root, file), 'utf8'), /note1/i, file);
  }
});
