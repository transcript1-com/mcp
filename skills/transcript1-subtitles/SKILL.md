---
name: transcript1-subtitles
description: Create SRT or WebVTT subtitle files from a video link or a local audio or video file using the transcript1 MCP server. Use when the user asks for subtitles, closed captions, an .srt or .vtt file, or captions to upload to YouTube, a video editor or a web player.
---

# Subtitles with transcript1

## Get the cues

1. Pick the format: `"srt"` unless the user asks otherwise (widest support: YouTube, editors, players), or `"vtt"` for web players and the HTML `<track>` element.
2. If the media was transcribed before, find it with `list_transcriptions` and use its `id`; another format of the same transcription costs nothing. Otherwise call `transcribe` with the link and `format`, or for a local file follow the upload steps in the `transcript1-transcribe` skill (`create_upload`, HTTP PUT of the chunks, `complete_upload`).
3. Call `get_transcription` with the `id` and the same `format` until `status` is `completed`. Set `max_chars: 100000` so long media needs fewer pages.
4. While `next_from_seconds` is not `null`, call `get_transcription` again with `from_seconds` set to it, and keep every page.

Leave `diarize` off unless the user wants speaker names in the subtitles. With it, SRT cues start with the speaker label and VTT cues use `<v Speaker>` voice tags.

## Build the file

Each reply starts with header lines (`id`, `status`, `format`, `segments`, `next_from_seconds`, ...). The subtitle text starts after the first blank line; keep only that part.

- **SRT**: cue numbers already continue across pages. Join the pages with a blank line between them, as between cues.
- **VTT**: every page starts with `WEBVTT`. Keep it once at the top and remove it from the later pages.

Check that the last cue number (SRT) or the cue count matches the total in the last page's `segments: X-Y of N` line. Write the file as UTF-8 next to the source or where the user asked, named after the media (e.g. `interview.srt`), and tell the user the path.

## Notes

- transcript1 transcribes the spoken language; it does not translate. For subtitles in another language, translate only the cue text and keep the numbers and timestamps unchanged.
- Captions from the platform (`transcript_source` other than `speech_to_text`) keep the platform's timing. Use `source: "stt"` when the user wants fresh AI timing or the captions are poor.
- Do not reflow or merge cues unless asked; editors and players expect the timing as given.
