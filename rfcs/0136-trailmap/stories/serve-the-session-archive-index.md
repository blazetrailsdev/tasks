---
title: "Serve the session archive read-only from trailmap"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ringo serves `/sessions`, `/sessions/<id>`, `/sessions/enroll`,
`/sessions/backfill` and `/api/sessions` from `webhook/sessionarchive.go`
(1,108 lines) and `webhook/sessionarchive_page.go` (513 lines). This is the
archive of every agent session the fleet has run — which pane it was on, which
story it worked, what it cost.

This is the first story of RFC 0136's phase C, the tmux-reading surface. It is
the largest single body of Go the dashboard has that trails has never had to
answer, and it is where the proving ground earns its keep: a session list is
ordinary CRUD, and the pane rendering behind it (see
`port-the-pane-terminal-emulator`) is anything but.

## Acceptance criteria

- `/sessions` and `/sessions/<id>` render in trailmap, read-only, with the same
  rows, ordering and columns as ringo's.
- The session data is read through models, not by re-implementing ringo's
  queries in a controller.
- `/api/sessions` serves the same JSON shape.
- Enroll and backfill are NOT ported — they are writes, and phase C is
  read-only.
- Controller tests cover the index and the show page.
- Every framework gap is filed as a trails story; a PR that files none should
  explain why.
