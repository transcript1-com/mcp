const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const platforms = ['YouTube', 'X', 'TikTok', 'Instagram', 'Facebook', 'Bluesky', 'Twitch', 'Dailymotion', 'Pinterest', 'LinkedIn', 'Snapchat Spotlight'];

test('package.json is publishable', () => {
  assert.equal(pkg.name, '@transcript1/mcp');
  assert.equal(pkg.version, '1.0.2');
  assert.equal(pkg.private, undefined);
  assert.deepEqual(pkg.publishConfig, { access: 'public' });
  assert.deepEqual(pkg.bugs, { email: 'support@transcript1.com', url: 'https://github.com/transcript1-com/mcp/issues' });
  assert.deepEqual(pkg.repository, { type: 'git', url: 'git+https://github.com/transcript1-com/mcp.git' });
  assert.equal(pkg.homepage, 'https://transcript1.com/docs/mcp');
  assert.equal(pkg.author, 'transcript1.com (one1.dev)');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.mcpName, 'com.transcript1/mcp');
  assert.deepEqual(pkg.bin, { 'transcript1-mcp': 'bin/transcript1-mcp.js' });
  assert.deepEqual(pkg.files, ['bin', 'lib', 'README.md', 'LICENSE']);
  assert.equal(pkg.engines.node, '>=18');
  assert.equal(pkg.scripts.prepublishOnly, 'npm test');
});

test('server.json matches the package version and stays within registry limits', () => {
  const server = JSON.parse(readFileSync(path.join(root, 'server.json'), 'utf8'));
  assert.equal(server.version, '1.0.2');
  assert.equal(server.packages[0].version, '1.0.2');
  assert.ok(server.description.length <= 100, `description is ${server.description.length} chars`);
  assert.ok(server.description.includes('TikTok'));
  assert.ok(server.description.includes('7 more social media platforms'));
});

test('package description names every supported platform', () => {
  for (const platform of platforms) {
    assert.ok(pkg.description.includes(platform), platform);
  }
});

test('license names the copyright holder', () => {
  const license = readFileSync(path.join(root, 'LICENSE'), 'utf8');
  assert.match(license, /Copyright \(c\) 2026 transcript1\.com \(one1\.dev\)/);
});

test('npm pack tarball contains only the intended files', () => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '--offline'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);

  const [packed] = JSON.parse(result.stdout);
  const files = packed.files.map(file => file.path).sort();
  assert.deepEqual(files, ['LICENSE', 'README.md', 'bin/transcript1-mcp.js', 'lib/bridge.js', 'package.json']);
});

test('readme documents setup, tools and support', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  for (const tool of ['transcribe', 'get_transcription', 'list_transcriptions', 'create_upload', 'get_upload_status', 'complete_upload', 'delete_transcription', 'get_account']) {
    assert.ok(readme.includes(`\`${tool}\``), tool);
  }

  for (const needle of [
    'npx',
    '-y',
    '@transcript1/mcp',
    'TRANSCRIPT1_API_KEY',
    'TRANSCRIPT1_MCP_URL',
    'https://transcript1.com/dashboard/account/tokens',
    'https://transcript1.com/#pricing',
    'https://transcript1.com/docs/sources-and-options',
    'support@transcript1.com',
  ]) {
    assert.ok(readme.includes(needle), needle);
  }

  assert.ok(!readme.includes('Until the package is published'));

  assert.match(readme, /links from YouTube, X, TikTok, Instagram, Facebook, Bluesky, Twitch, Dailymotion, Pinterest, LinkedIn and Snapchat Spotlight in Claude/);
  assert.match(readme, /from a link on any supported platform and wait/);

  assert.ok(!readme.includes('from a YouTube URL'));
});

test('glama.json names the maintainers who can claim the Glama listing', () => {
  const glama = JSON.parse(readFileSync(path.join(root, 'glama.json'), 'utf8'));
  assert.deepEqual(glama, {
    $schema: 'https://glama.ai/mcp/schemas/server.json',
    maintainers: ['patrykcieszkowski'],
  });
});

test('readme shows the Glama score badge', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes('[![transcript1-com/mcp MCP server](https://glama.ai/mcp/servers/transcript1-com/mcp/badges/score.svg)](https://glama.ai/mcp/servers/transcript1-com/mcp)'));
});

test('readme explains the hosted server for Claude and ChatGPT', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /## Claude and ChatGPT/);
  assert.match(readme, /custom connector with the URL `https:\/\/api\.transcript1\.com\/mcp`/);
});
