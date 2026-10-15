const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

test('package.json is publishable', () => {
  assert.equal(pkg.name, '@transcript1/mcp');
  assert.equal(pkg.version, '1.0.0');
  assert.equal(pkg.private, undefined);
  assert.deepEqual(pkg.publishConfig, { access: 'public' });
  assert.deepEqual(pkg.bugs, { email: 'support@transcript1.com' });
  assert.equal(pkg.homepage, 'https://transcript1.com/docs/mcp');
  assert.equal(pkg.author, 'transcript1.com (one1.dev)');
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.mcpName, 'com.transcript1/mcp');
  assert.deepEqual(pkg.bin, { 'transcript1-mcp': 'bin/transcript1-mcp.js' });
  assert.deepEqual(pkg.files, ['bin', 'lib', 'README.md', 'LICENSE']);
  assert.equal(pkg.engines.node, '>=18');
  assert.equal(pkg.scripts.prepublishOnly, 'npm test');
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

  for (const needle of ['npx', '-y', '@transcript1/mcp', 'TRANSCRIPT1_API_KEY', 'TRANSCRIPT1_MCP_URL', 'https://transcript1.com/dashboard/account/tokens', 'https://transcript1.com/#pricing', 'support@transcript1.com']) {
    assert.ok(readme.includes(needle), needle);
  }

  assert.ok(!readme.includes('Until the package is published'));
});
