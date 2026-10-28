const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const platforms = ['YouTube', 'X', 'TikTok', 'Instagram', 'Facebook', 'Bluesky', 'Twitch', 'Dailymotion', 'Pinterest', 'LinkedIn', 'Snapchat Spotlight'];

test('package.json is publishable', () => {
  assert.equal(pkg.name, '@transcript1/mcp');
  assert.equal(pkg.version, '1.0.3');
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
  assert.equal(server.version, '1.0.3');
  assert.equal(server.packages[0].version, '1.0.3');
  assert.ok(server.description.length <= 100, `description is ${server.description.length} chars`);
  assert.ok(server.description.includes('TikTok'));
  assert.ok(server.description.includes('7 more social media platforms'));
});

test('server.json lists the API key as optional', () => {
  const server = JSON.parse(readFileSync(path.join(root, 'server.json'), 'utf8'));
  const [key] = server.packages[0].environmentVariables;
  assert.equal(key.name, 'TRANSCRIPT1_API_KEY');
  assert.equal(key.isRequired, false);
  assert.equal(key.isSecret, true);
  assert.match(key.description, /browser/);
});

test('package-lock.json matches the package version', () => {
  const lock = JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
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

test('readme shows the LobeHub badge', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes('[![MCP Badge](https://lobehub.com/badge/mcp/transcript1-com-mcp?style=flat)](https://lobehub.com/mcp/transcript1-com-mcp)'));
});

const skillNames = ['transcript1-subtitles', 'transcript1-summarize', 'transcript1-transcribe'];

const readFrontmatter = file => {
  const content = readFileSync(file, 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(content);
  assert.ok(match, `${file} starts with frontmatter`);
  const fields = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(': ');
    fields[line.slice(0, separator)] = line.slice(separator + 2);
  }

  return { fields, body: match[2] };
};

test('skills folder holds the documented skills', () => {
  const dirs = readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  assert.deepEqual(dirs, skillNames);
});

test('every skill has Agent Skills frontmatter matching its folder', () => {
  for (const name of skillNames) {
    const { fields, body } = readFrontmatter(path.join(root, 'skills', name, 'SKILL.md'));
    assert.deepEqual(Object.keys(fields).sort(), ['description', 'name'], name);
    assert.equal(fields.name, name);
    assert.match(fields.name, /^[a-z\d]+(?:-[a-z\d]+)*$/);
    assert.ok(fields.description.length > 0 && fields.description.length <= 1024, `${name} description length`);
    assert.ok(!fields.description.includes(': ') && !fields.description.includes(' #'), `${name} description is a plain YAML scalar`);
    assert.ok(body.trim().length > 0, `${name} has instructions`);
  }
});

test('readme lists example prompts and every skill', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /## Example prompts/);
  assert.match(readme, /## Agent Skills/);
  assert.ok(readme.includes('npx skills add transcript1-com/mcp'));
  for (const name of skillNames) {
    assert.ok(readme.includes(`\`${name}\``), name);
  }
});

test('readme explains the hosted server for Claude and ChatGPT', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /## Connect without this package/);
  assert.match(readme, /custom connector with the URL `https:\/\/api\.transcript1\.com\/mcp`/);
  assert.ok(readme.includes('claude mcp add --transport http transcript1 https://api.transcript1.com/mcp`'));
});

test('readme makes the API key optional', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /opens transcript1 in your browser/);
  assert.match(readme, /### Use an API key instead/);
  assert.match(readme, /\| `TRANSCRIPT1_API_KEY` \| no \|/);
  assert.ok(!readme.includes('Bearer t1_'));
  assert.ok(!readme.includes('You need a transcript1 account and an API key'));
});
