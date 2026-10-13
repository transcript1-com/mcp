'use strict';

const DEFAULT_SERVER_URL = 'https://api.transcript1.com/mcp';
const TOKEN_ENV = 'TRANSCRIPT1_API_KEY';
const URL_ENV = 'TRANSCRIPT1_MCP_URL';
const AUTH_HEADER_ENV = 'TRANSCRIPT1_AUTH_HEADER';
const API_KEYS_URL = 'https://transcript1.com/dashboard/account/tokens';

const buildMissingTokenMessage = () => [
  `transcript1-mcp: missing ${TOKEN_ENV}.`,
  '',
  `Create an API key at ${API_KEYS_URL},`,
  'then set it in your MCP client config, e.g. for Claude Desktop:',
  '',
  '  {',
  '    "mcpServers": {',
  '      "transcript1": {',
  '        "command": "npx",',
  '        "args": ["-y", "@transcript1/mcp"],',
  `        "env": { "${TOKEN_ENV}": "t1_..." }`,
  '      }',
  '    }',
  '  }',
].join('\n');

const parseUrl = value => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isAllowedUrl = value => {
  const parsed = parseUrl(value);
  if (!parsed) {
    return false;
  }

  if (parsed.protocol === 'https:') {
    return true;
  }

  if (parsed.protocol !== 'http:') {
    return false;
  }

  return ['localhost', '127.0.0.1'].includes(parsed.hostname);
};

const resolveConfig = env => {
  const token = env[TOKEN_ENV];
  if (!token) {
    return { error: buildMissingTokenMessage() };
  }

  if (!token.startsWith('t1_')) {
    return { error: `transcript1-mcp: ${TOKEN_ENV} must be a transcript1 API key (t1_...).` };
  }

  const url = env[URL_ENV] || DEFAULT_SERVER_URL;
  if (!isAllowedUrl(url)) {
    return { error: `transcript1-mcp: ${URL_ENV} must use https.` };
  }

  return { token, url };
};

// keep the key out of argv, mcp-remote reads it from env
const buildArgs = options => {
  const { mcpRemoteBin, url, extraArgs } = options;
  return [mcpRemoteBin, url, '--header', `Authorization:\${${AUTH_HEADER_ENV}}`, ...extraArgs];
};

const buildEnv = (env, token) => ({ ...env, [AUTH_HEADER_ENV]: `Bearer ${token}` });

module.exports = {
  DEFAULT_SERVER_URL,
  TOKEN_ENV,
  URL_ENV,
  AUTH_HEADER_ENV,
  API_KEYS_URL,
  missingTokenMessage: buildMissingTokenMessage,
  resolveConfig,
  buildArgs,
  buildEnv,
};
