---
title: "rails/: Fleet::Relay streams /sessions/file and stops at the 128 MiB cap"
status: ready
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The trails app reads ringo's `/sessions/file` answer as a stream and stops at the cap (`lib/archive-read.ts` `readBounded`, `ARCHIVE_FILE_MAX_BYTES = 128 MiB` in `app/controllers/sessions-controller.ts`). The Rails twin's `SessionsController#read_archive` goes through `Fleet::Relay.get` (`rails/lib/fleet/relay.rb`), which reads the whole body, so an oversized file is fully in memory before the 413. Recorded in `rails/DEVIATIONS.md` as "`/sessions/file` holds the whole answer before the size check" (trailmap#88).

## Acceptance criteria

- [ ] `Fleet::Relay` gains a bounded read (`Net::HTTP#request` with `read_body` chunks) that stops past a byte limit, and `read_archive` uses it.
- [ ] A test feeds a body over the cap and shows the read stopped early, with a 413.
- [ ] The DEVIATIONS.md entry is removed.
