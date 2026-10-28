---
name: transcript1-summarize
description: Summarize a video, podcast, meeting recording or audio file with timestamps using the transcript1 MCP server. Use when the user asks for a summary, key points, chapters, quotes, show notes, meeting notes or action items from a YouTube, X, TikTok, Instagram or other video link, or from a local recording.
---

# Summarize media with transcript1

Get the whole transcript first, then write only from it.

## Get the transcript

Follow the `transcript1-transcribe` skill if it is installed. Otherwise call `transcribe` with the link (or upload a local file with `create_upload`, HTTP PUT of the chunks and `complete_upload`), then `get_transcription` until `status` is `completed`.

- Use `format: "text"`. Each line starts with `[HH:MM:SS]` and, with speakers, a speaker label.
- Set `diarize: true` for meetings, interviews and podcasts so you can attribute what was said. For one speaker, leave it off so native captions can be used.
- When `next_from_seconds` is not `null`, call `get_transcription` again with `from_seconds` set to it. Read every page before writing; never summarize the first page alone.

## Write

Unless the user asks for another shape:

1. **Summary**: one short paragraph on what the recording is about and its conclusion.
2. **Key points**: bullets, each ending with the timestamp it comes from, e.g. `[00:12:34]`.
3. **Chapters** for recordings over about 10 minutes: one `HH:MM:SS Title` line per section, starting at `00:00:00`. For YouTube descriptions, drop the hours (`MM:SS`) when the video is under an hour; YouTube needs at least three chapters, the first at `00:00`.

Other common requests:

- **Quotes**: copy them word for word from the transcript with their timestamp. Attribute them only to speaker labels the transcript gives; use real names only when the speakers introduce themselves.
- **Meeting notes**: decisions, action items (owner, task, due date when stated) and open questions.
- **Show notes**: summary, chapters, and the people, products and links mentioned.

For YouTube links, a timestamp can link to the moment with the `t` parameter in seconds, e.g. `https://www.youtube.com/watch?v=VIDEO_ID&t=754s` for `[00:12:34]`.

## Accuracy

- State only what the transcript says. Mark unclear passages instead of guessing.
- Speech-to-text and auto-generated captions can misspell names and terms; flag the ones you are unsure of.
- Name the source from `transcript_source`, e.g. "from YouTube auto-generated captions" or "from AI speech-to-text".
