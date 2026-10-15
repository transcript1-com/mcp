# @transcript1/mcp

MCP (Model Context Protocol) connector for [transcript1](https://transcript1.com), an API- and MCP-first transcription service. It lets Claude, Cursor, VS Code, and other MCP clients transcribe a YouTube video from its URL, upload an audio or video file, and read the transcript back with speaker labels and timestamps.

This package is a small stdio bridge to the hosted server at `https://api.transcript1.com/mcp`. It wraps [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) and signs in with your API key, for clients that launch MCP servers as commands. Docs: [transcript1.com/docs/mcp](https://transcript1.com/docs/mcp).

## Setup

You need a transcript1 account and an API key (starts with `t1_`). Create one at [transcript1.com/dashboard/account/tokens](https://transcript1.com/dashboard/account/tokens). It is shown once, so copy it.

Every client below runs the same command, `npx -y @transcript1/mcp`, with `TRANSCRIPT1_API_KEY` set. Requires Node.js 18 or newer.

### Claude Desktop

Add to `claude_desktop_config.json`:

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

### Cursor

Add to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

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

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "transcript1": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@transcript1/mcp"],
      "env": { "TRANSCRIPT1_API_KEY": "t1_YOURKEY" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add transcript1 --env TRANSCRIPT1_API_KEY=t1_YOURKEY -- npx -y @transcript1/mcp
```

### Any other MCP client

Configure a stdio server with command `npx`, arguments `-y @transcript1/mcp`, and the environment variable `TRANSCRIPT1_API_KEY`.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `TRANSCRIPT1_API_KEY` | yes | Your transcript1 API key. Must start with `t1_`. |
| `TRANSCRIPT1_MCP_URL` | no | Server URL. Defaults to `https://api.transcript1.com/mcp`. Must use `https`; plain `http` is accepted only for `localhost` and `127.0.0.1`. |

The key is passed to `mcp-remote` through its environment, not on the command line. Extra arguments given to the command are forwarded to `mcp-remote`.

## Tools

- `transcribe`: create a transcription from a YouTube URL and wait briefly for the result.
- `get_transcription`: status or transcript of a job, as text, SRT, VTT, or JSON, with paging for long transcripts.
- `list_transcriptions`: your recent jobs, filterable and paginated.
- `create_upload`: reserve a chunked upload for a local audio or video file.
- `get_upload_status`: see which chunks were received, to resume an interrupted upload.
- `complete_upload`: verify an upload and queue it for transcription.
- `delete_transcription`: cancel a running job or delete a finished one.
- `get_account`: minutes remaining, current plan, and renewal date.

All tools act on your own account only.

## Pricing

See [transcript1.com/#pricing](https://transcript1.com/#pricing).

## Support

support@one1.dev

## License

MIT. Copyright (c) 2026 transcript1.com (one1.dev).
