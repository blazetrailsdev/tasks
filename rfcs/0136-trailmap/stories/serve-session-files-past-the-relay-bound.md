---
title: "/sessions/file refuses files over 128 MiB and the pane view replays only 2 MiB"
status: ready
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#82 bounds two session reads because of the framework gaps filed alongside this story:

- `/sessions/file` reads at most 128 MiB (`ARCHIVE_FILE_MAX_BYTES`, `app/controllers/sessions-controller.ts`) and answers 413 past it, because a controller cannot stream a body (`controller-cannot-respond-with-a-readable-stream-body`). The largest archive file today is 90 MB.
- `/sessions/pane` replays only the last 2 MiB (`PANE_VIEW_MAX_BYTES`), against ringo's 32 MiB, because the replay is synchronous and there is no worker adapter (`no-worker-adapter-for-cpu-bound-work`).

## Acceptance criteria

- Once the framework can stream a response body, `/sessions/file` streams any size and the 413 is removed.
- Once a worker adapter exists, `/sessions/pane` replays the same 32 MiB tail ringo does, off the main thread, and the 2 MiB bound is removed.
