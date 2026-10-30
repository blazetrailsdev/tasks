---
title: "/sessions/transcript runs ringo's reader synchronously over up to 128 MiB"
status: claimed
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-10-30T00:53:46Z"
assignee: "bound-the-transcript-parse-on-the-request-thread"
blocked-by: null
closed-reason: null
---

## Context

trailmap#93 draws `/sessions/transcript` by running ringo's `core.ParseTranscript` from `vendor/ringo/core.wasm` (`lib/ringo-core.ts` `parseTranscript`). A call is synchronous and holds the event loop. `/sessions/pane` bounds its input to the last 2 MiB for exactly that reason (`PANE_VIEW_MAX_BYTES`, `app/controllers/sessions-controller.ts`), but the transcript reads up to `ARCHIVE_FILE_MAX_BYTES` (128 MiB) and parses all of it. One large transcript stalls every other request for as long as the parse takes. That cost has not been measured.

The worker adapter that would move this off the main thread is `no-worker-adapter-for-cpu-bound-work` (RFC 0154). This story is the application half until that lands.

## Acceptance criteria

- Measure `parseTranscript` against the archive's largest transcripts (ms per MB), as `lib/ringo-core.ts` records for the pane replay.
- Bound what one request parses (bytes, or ringo's `maxSteps`) so the worst stall is stated and small, and say so on the page when the bound cuts the session short.
- The same bound in `rails/app/controllers/sessions_controller.rb`.
