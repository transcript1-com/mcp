# @transcript1/mcp

[![transcript1-com/mcp MCP server](https://glama.ai/mcp/servers/transcript1-com/mcp/badges/score.svg)](https://glama.ai/mcp/servers/transcript1-com/mcp) [![MCP Badge](https://lobehub.com/badge/mcp/transcript1-com-mcp?style=flat)](https://lobehub.com/mcp/transcript1-com-mcp)

MCP (Model Context Protocol) connector for [transcript1](https://transcript1.com), an audio and video transcription service. Transcribe file uploads or links from YouTube, X, TikTok, Instagram, Facebook, Bluesky, Twitch, Dailymotion, Pinterest, LinkedIn and Snapchat Spotlight in Claude, Cursor, VS Code, and other MCP clients, and read the transcript with timestamps and optional speaker labels. Links must be public, recorded videos; [Sources and options](https://transcript1.com/docs/sources-and-options) lists the accepted link forms.

This package is a small stdio bridge to the hosted server at `https://api.transcript1.com/mcp`. It wraps [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) and signs in with your API key, for clients that launch MCP servers as commands. Docs: [transcript1.com/docs/mcp](https://transcript1.com/docs/mcp).

## Claude and ChatGPT

Claude and ChatGPT can connect to the hosted server directly, without this package. Add a custom connector with the URL `https://api.transcript1.com/mcp`, then sign in to transcript1 and approve access. Custom connectors depend on your plan; see [transcript1.com/docs/mcp](https://transcript1.com/docs/mcp).

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

- `transcribe`: create a transcription from a link on any supported platform and wait briefly for the result.
- `get_transcription`: status or transcript of a job, as text, SRT, VTT, or JSON, with paging for long transcripts.
- `list_transcriptions`: your recent jobs, filterable and paginated.
- `create_upload`: reserve a chunked upload for a local audio or video file.
- `get_upload_status`: see which chunks were received, to resume an interrupted upload.
- `complete_upload`: verify an upload and queue it for transcription.
- `delete_transcription`: cancel a running job or delete a finished one.
- `get_account`: minutes remaining, current plan, and renewal date.

All tools act on your own account only.

## Example prompts

Once the server is connected, ask in plain language:

- "Summarize this YouTube video with timestamps: https://www.youtube.com/watch?v=VIDEO_ID"
- "Transcribe this podcast episode with speaker labels: LINK"
- "Make SRT subtitles for this TikTok and save them as `subs.srt`: LINK"
- "Transcribe `~/Downloads/interview.m4a`" (local files need a client that can run shell commands, such as Claude Code or Cursor)
- "Give me the five best quotes from this interview, with timestamps: LINK"
- "Write meeting notes with decisions and action items from `team-call.mp4`"
- "How many transcription minutes do I have left?"

## Agent Skills

The [`skills`](skills) folder has [Agent Skills](https://agentskills.io) that teach an agent how to use these tools well: waiting for results, reading long transcripts page by page, uploading files in chunks, and writing from the full transcript. They work with the MCP server; they do not replace it.

| Skill | Use it for |
| --- | --- |
| [`transcript1-transcribe`](skills/transcript1-transcribe/SKILL.md) | Transcripts of links and local files, with speaker labels and chunked uploads |
| [`transcript1-summarize`](skills/transcript1-summarize/SKILL.md) | Summaries, key points, chapters, quotes and meeting notes with timestamps |
| [`transcript1-subtitles`](skills/transcript1-subtitles/SKILL.md) | SRT and WebVTT subtitle files |

Install them with the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add transcript1-com/mcp
```

Or copy a skill folder into `~/.claude/skills/` (Claude Code, every project) or `.claude/skills/` (one project). In the Claude apps, upload the skill folder as a ZIP file in the Skills settings.

## Pricing

See [transcript1.com/#pricing](https://transcript1.com/#pricing).

## Support

support@transcript1.com

## License

MIT. Copyright (c) 2026 transcript1.com (one1.dev).
