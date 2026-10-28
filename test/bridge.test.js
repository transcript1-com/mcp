const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  DEFAULT_SERVER_URL, browserSignInMessage, buildArgs, buildEnv, resolveConfig,
} = require('../lib/bridge.js');

const root = path.join(__dirname, '..');

test('defaults to the hosted transcript1 server', () => {
  const config = resolveConfig({ TRANSCRIPT1_API_KEY: 't1_abc' });
  assert.deepEqual(config, { token: 't1_abc', url: 'https://api.transcript1.com/mcp' });
});

test('honors TRANSCRIPT1_MCP_URL for local servers', () => {
  const config = resolveConfig({ TRANSCRIPT1_API_KEY: 't1_abc', TRANSCRIPT1_MCP_URL: 'http://127.0.0.1:3000/mcp' });
  assert.deepEqual(config, { token: 't1_abc', url: 'http://127.0.0.1:3000/mcp' });
});

test('signs in through the browser when the key is missing', () => {
  assert.deepEqual(resolveConfig({}), { url: 'https://api.transcript1.com/mcp' });
});

test('treats an empty key as missing', () => {
  assert.deepEqual(resolveConfig({ TRANSCRIPT1_API_KEY: '' }), { url: 'https://api.transcript1.com/mcp' });
});

test('honors TRANSCRIPT1_MCP_URL without a key', () => {
  assert.deepEqual(resolveConfig({ TRANSCRIPT1_MCP_URL: 'http://127.0.0.1:3000/mcp' }), { url: 'http://127.0.0.1:3000/mcp' });
});

test('still rejects plain-http remote URLs without a key', () => {
  const { error } = resolveConfig({ TRANSCRIPT1_MCP_URL: 'http://evil.example/mcp' });
  assert.equal(error, 'transcript1-mcp: TRANSCRIPT1_MCP_URL must use https.');
});

test('the sign-in notice says how to use a key instead', () => {
  assert.match(browserSignInMessage(), /sign in to transcript1 in your browser/);
  assert.match(browserSignInMessage(), /TRANSCRIPT1_API_KEY/);
  assert.match(browserSignInMessage(), /https:\/\/transcript1\.com\/dashboard\/account\/tokens/);
});

test('rejects keys that are not transcript1 API keys', () => {
  const { error } = resolveConfig({ TRANSCRIPT1_API_KEY: 'n1_old' });
  assert.equal(error, 'transcript1-mcp: TRANSCRIPT1_API_KEY must be a transcript1 API key (t1_...).');
});

test('rejects plain-http remote URLs', () => {
  const { error } = resolveConfig({ TRANSCRIPT1_API_KEY: 't1_abc', TRANSCRIPT1_MCP_URL: 'http://evil.example/mcp' });
  assert.equal(error, 'transcript1-mcp: TRANSCRIPT1_MCP_URL must use https.');
});

test('passes the bearer header as an environment reference and extra arguments to mcp-remote', () => {
  const args = buildArgs({ mcpRemoteBin: '/x/proxy.js', url: DEFAULT_SERVER_URL, useKey: true, extraArgs: ['--debug'] });
  assert.deepEqual(args, ['/x/proxy.js', 'https://api.transcript1.com/mcp', '--header', 'Authorization:${TRANSCRIPT1_AUTH_HEADER}', '--debug']);
});

test('sends no Authorization header without a key, so mcp-remote signs in with OAuth', () => {
  const args = buildArgs({ mcpRemoteBin: '/x/proxy.js', url: DEFAULT_SERVER_URL, useKey: false, extraArgs: ['--debug'] });
  assert.deepEqual(args, ['/x/proxy.js', 'https://api.transcript1.com/mcp', '--debug']);
});

test('puts the bearer header only in the child environment', () => {
  const env = buildEnv({ PATH: '/bin', TRANSCRIPT1_API_KEY: 't1_abc' }, 't1_abc');
  assert.equal(env.TRANSCRIPT1_AUTH_HEADER, 'Bearer t1_abc');
  assert.equal(env.PATH, '/bin');
});

test('adds no bearer header to the child environment without a key', () => {
  const env = buildEnv({ PATH: '/bin' }, undefined);
  assert.deepEqual(env, { PATH: '/bin' });
});

test('the bin spawns mcp-remote without the key on its command line', () => {
  const source = readFileSync(path.join(root, 'bin/transcript1-mcp.js'), 'utf8');
  assert.match(source, /env: buildEnv\(process\.env, config\.token\)/);
  assert.doesNotMatch(source, /token: config\.token/);
});

test('the bin starts mcp-remote with browser sign-in when the key is missing', () => {
  // Port 9 is refused by fetch, so mcp-remote fails to connect before any OAuth or browser step.
  const configDir = mkdtempSync(path.join(os.tmpdir(), 'transcript1-mcp-'));
  const result = spawnSync(process.execPath, [path.join(root, 'bin/transcript1-mcp.js')], {
    env: {
      PATH: process.env.PATH,
      HOME: configDir,
      MCP_REMOTE_CONFIG_DIR: configDir,
      TRANSCRIPT1_MCP_URL: 'http://127.0.0.1:9/mcp',
    },
    input: '',
    encoding: 'utf8',
    timeout: 15_000,
  });
  rmSync(configDir, { recursive: true, force: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /sign in to transcript1 in your browser/);
  assert.doesNotMatch(result.stderr, /missing TRANSCRIPT1_API_KEY/);
});

test('the bin still exits 1 for keys that are not transcript1 API keys', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'bin/transcript1-mcp.js')], {
    env: {
      PATH: process.env.PATH,
      TRANSCRIPT1_API_KEY: 'n1_old',
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be a transcript1 API key/);
});

test('the package is branded transcript1 with no leftover note1 references', () => {
  for (const file of ['package.json', 'package-lock.json', 'README.md', 'LICENSE', 'bin/transcript1-mcp.js', 'lib/bridge.js']) {
    assert.doesNotMatch(readFileSync(path.join(root, file), 'utf8'), /note1/i, file);
  }
});
