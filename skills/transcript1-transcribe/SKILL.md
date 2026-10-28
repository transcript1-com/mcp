---
name: transcript1-transcribe
description: Transcribe a video link or a local audio or video file with the transcript1 MCP server and read the whole transcript. Use when the user asks for a transcript, the spoken text or a speaker-labelled transcript of a YouTube, X, TikTok, Instagram, Facebook, Bluesky, Twitch, Dailymotion, Pinterest, LinkedIn or Snapchat Spotlight link, or of a local file such as mp3, m4a, wav or mp4.
---

# Transcribe with transcript1

This skill uses the transcript1 MCP tools (`transcribe`, `get_transcription`, `list_transcriptions`, `create_upload`, `get_upload_status`, `complete_upload`, `get_account`). If they are not available, ask the user to connect the server: https://transcript1.com/docs/mcp.

## Links

1. Call `transcribe` with `url`. Leave `platform` out; it is detected from the link.
2. Set options only when the request needs them:
   - `diarize: true` for speaker labels (interviews, podcasts, meetings). It always uses speech-to-text.
   - `source`: `"auto"` (default) uses the platform's own captions when they exist, otherwise speech-to-text. `"stt"` forces speech-to-text, for example when captions are missing words or the user asks for an AI transcript. `"captions"` uses captions only and fails without them.
   - `language`: a two-letter ISO 639-1 code when the user names the spoken language; otherwise leave it out.
   - `format`: `"text"` (default, timestamps and speakers) for reading, `"srt"` or `"vtt"` for subtitles, `"json"` for segments you will process further.
3. `transcribe` waits up to 50 seconds. If the reply says the job is not finished, call `get_transcription` with the returned `id` until `status` is `completed`. Each call waits up to 50 seconds again. For long media, tell the user it is still working.
4. If `transcribe` returns an error you did not expect or times out, do not call it again. Find the job with `list_transcriptions`, then call `get_transcription` with its `id`. The same link and options within 24 hours return the earlier transcription without another charge (`reused: true`), but short links may not be matched.

Links must be public, recorded videos. Live streams, private posts and external embeds are not supported, and only the first video in a post is used. Accepted link forms: https://transcript1.com/docs/sources-and-options.

## Long transcripts

One reply holds up to 60,000 characters by default (`max_chars`, up to 100,000). When `next_from_seconds` is not `null`, call `get_transcription` with the same `id` and `format` and `from_seconds` set to that value. Repeat until `next_from_seconds` is `null`.

Read every page before answering questions about the whole recording. If you stop early, say which time range you covered.

## Local files

Supported: mp3, wav, m4a, flac, ogg, opus, mp4, mov, webm and mkv, up to 2 GB. This needs a shell that can send HTTP requests.

1. Get the size in bytes: `wc -c < "FILE"`.
2. Generate a UUID for `request_id`: `uuidgen` or `python3 -c 'import uuid; print(uuid.uuid4())'`. Keep it for retries.
3. Call `create_upload` with `filename`, `size` and `request_id`, plus `diarize` or `language` if needed.
4. The reply lists chunks as `index offset size`. Send each one with HTTP PUT to `chunk_url_template`, with `{index}` replaced by the chunk index:

   ```bash
   tail -c +$((OFFSET + 1)) "FILE" | head -c SIZE | curl -sSf -X PUT --data-binary @- \
     -H "X-Upload-Token: TOKEN" -H "Content-Type: application/octet-stream" "CHUNK_URL"
   ```

5. Call `complete_upload` with the `id`, then `get_transcription` until `status` is `completed`.

If an upload is interrupted, call `get_upload_status` and send only the `missing_chunks`. If the upload token expired, call `create_upload` again with the same `request_id` for a new token. If you cannot run shell commands, ask the user to upload the file at https://transcript1.com/dashboard/upload and then read it with `list_transcriptions` and `get_transcription`.

## Minutes and errors

- Every source costs 1 minute per started media minute. `get_account` shows the minutes left.
- On `insufficient_minutes`, tell the user the minutes needed and remaining from the error and link https://transcript1.com/#pricing. Do not retry.
- Follow the next step named in any other error message; do not loop on the same call.
- Only call `delete_transcription` when the user asks. It cancels a running job (minutes are refunded) or permanently deletes a finished one.

## Answering

Give the title, duration and where the text came from (`transcript_source`: native captions or AI speech-to-text) with the transcript or answer. Keep the `[HH:MM:SS]` timestamps when quoting.
