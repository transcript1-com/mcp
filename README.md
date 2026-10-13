# transcript1 MCP Server

**Transcribe YouTube videos and audio or video files from Claude, ChatGPT, Cursor, or any MCP client.**

[transcript1](https://transcript1.com) is an API- and MCP-first transcription service. This MCP (Model Context Protocol) server lets AI tools transcribe a YouTube video from its URL, upload an audio or video file, wait for the result, and read the transcript back with speaker labels and timestamps, all from a conversation. Long transcripts are paged so they fit in the model's context.

Every tool acts with the authenticated user's own account: jobs, uploads, and minutes are yours alone.

- **Server URL:** `https://api.transcript1.com/mcp` (Streamable HTTP)
- **Docs:** [transcript1.com/docs/mcp](https://transcript1.com/docs/mcp)
- **Auth:** OAuth 2.1 (automatic browser consent) or API keys (`Authorization: Bearer t1_...`)

## Tools

| Tool | Description |
| --- | --- |
| `transcribe` | Create a transcription from a YouTube URL (or other supported source) and wait up to `wait_seconds` (default 50, max 55). Returns the transcript if it is done, otherwise the job `id`, its `status`, and an instruction to call `get_transcription`. |
| `get_transcription` | Status or result of a job, with optional waiting and paging (`from_seconds`, `max_chars`). Formats: `text` (default), `srt`, `vtt`, `json`. |
| `list_transcriptions` | Recent transcription jobs, filterable by status and platform, paginated. Returns jobs without transcripts. |
| `create_upload` | Reserve a chunked upload for a local audio or video file. Returns the transcription `id`, a chunk URL template, an upload token, the chunk list, and a dashboard upload link as a fallback. File bytes are sent over HTTP, outside MCP. |
| `get_upload_status` | Which chunks of an upload were acknowledged, so an interrupted upload can resume. |
| `complete_upload` | Verify an upload and queue it for transcription. |
| `delete_transcription` | Cancel a running job or delete a finished one. Destructive. |
| `get_account` | Minutes remaining, current plan, and renewal date. |

## Quick start

You need a transcript1 account ([transcript1.com](https://transcript1.com)). For key-based setups, create an API key under **Account → API keys** (shown once — copy it).

### Claude (web) — OAuth, no key

1. [Claude Settings → Connectors](https://claude.ai/settings/connectors) → **Add custom connector**
2. Name: `transcript1` — URL: `https://api.transcript1.com/mcp` — leave the OAuth fields empty
3. **Add**, then approve access on the transcript1 consent page

### Claude Desktop

Through the `npx` package:

```json
{
  "mcpServers": {
    "transcript1": {
      "command": "npx",
      "args": ["-y", "@transcript1/mcp"],
      "env": { "TRANSCRIPT1_API_KEY": "t1_YOURKEY" }
    }
  }
}
```

Until the package is published, run it from a checkout instead:

```json
{
  "mcpServers": {
    "transcript1": {
      "command": "node",
      "args": ["/path/to/mcp/bin/transcript1-mcp.js"],
      "env": { "TRANSCRIPT1_API_KEY": "t1_YOURKEY" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add --transport http transcript1 https://api.transcript1.com/mcp --header "Authorization: Bearer t1_YOURKEY"
```

### Cursor

```json
{
  "mcpServers": {
    "transcript1": {
      "url": "https://api.transcript1.com/mcp",
      "headers": { "Authorization": "Bearer t1_YOURKEY" }
    }
  }
}
```

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `TRANSCRIPT1_API_KEY` | yes | Your transcript1 API key. Must start with `t1_`. |
| `TRANSCRIPT1_MCP_URL` | no | Server URL. Defaults to `https://api.transcript1.com/mcp`. Must use `https`; plain `http` is accepted only for `localhost` and `127.0.0.1`, for local development. |

## How this package works

The hosted MCP server lives at `https://api.transcript1.com/mcp`. This package (`@transcript1/mcp`) is a thin stdio bridge for clients that launch MCP servers as commands: it wraps [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) with the server URL and your `TRANSCRIPT1_API_KEY`, sending the key as a bearer token. Arguments passed to the command are forwarded to `mcp-remote`. Clients with native remote support (claude.ai, Cursor) can connect to the URL directly and skip it.

## Security

- API keys are shown once at creation and stored only as hashes server-side. Revoke them anytime under **Account → API keys**.
- The bridge refuses plain-`http` server URLs except for `localhost` and `127.0.0.1`, so your key is not sent in the clear.
- Read tools are marked read-only. `delete_transcription` is destructive, so clients should ask for confirmation before calling it.

## License

MIT
