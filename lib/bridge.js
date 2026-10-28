'use strict';

const DEFAULT_SERVER_URL = 'https://api.transcript1.com/mcp';
const TOKEN_ENV = 'TRANSCRIPT1_API_KEY';
const URL_ENV = 'TRANSCRIPT1_MCP_URL';
const AUTH_HEADER_ENV = 'TRANSCRIPT1_AUTH_HEADER';
const API_KEYS_URL = 'https://transcript1.com/dashboard/account/tokens';

const buildBrowserSignInMessage = () => [
  `transcript1-mcp: ${TOKEN_ENV} is not set, so sign in to transcript1 in your browser when the sign-in page opens.`,
  `On a machine without a browser (SSH, CI, containers), set ${TOKEN_ENV} to an API key from ${API_KEYS_URL} instead.`,
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
  if (token && !token.startsWith('t1_')) {
    return { error: `transcript1-mcp: ${TOKEN_ENV} must be a transcript1 API key (t1_...).` };
  }

  const url = env[URL_ENV] || DEFAULT_SERVER_URL;
  if (!isAllowedUrl(url)) {
    return { error: `transcript1-mcp: ${URL_ENV} must use https.` };
  }

  return token ? { token, url } : { url };
};

// keep the key out of argv, mcp-remote reads it from env; without a key, mcp-remote signs in with OAuth
const buildArgs = options => {
  const {
    mcpRemoteBin, url, useKey, extraArgs,
  } = options;
  const header = useKey ? ['--header', `Authorization:\${${AUTH_HEADER_ENV}}`] : [];
  return [mcpRemoteBin, url, ...header, ...extraArgs];
};

const buildEnv = (env, token) => (token ? { ...env, [AUTH_HEADER_ENV]: `Bearer ${token}` } : { ...env });

module.exports = {
  DEFAULT_SERVER_URL,
  TOKEN_ENV,
  URL_ENV,
  AUTH_HEADER_ENV,
  API_KEYS_URL,
  browserSignInMessage: buildBrowserSignInMessage,
  resolveConfig,
  buildArgs,
  buildEnv,
};
