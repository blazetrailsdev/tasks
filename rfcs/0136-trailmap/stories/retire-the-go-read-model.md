---
title: "Delete webhook/tasksdb.go and read the API instead"
status: claimed
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: ["serve-the-read-verbs-as-json"]
deps-rfc: []
est-loc: 200
priority: 12
pr: null
claim: "2026-09-05T23:01:36Z"
assignee: "serve-the-mutation-verbs-as-json"
blocked-by: null
closed-reason: null
---

## Context

With the read API serving, ringo's own read model is redundant. Delete
`webhook/tasksdb.go` — roughly 400 lines of Go whose header admits its own
fragility: the structs "must reproduce `readmodel.ts` exactly, because the same
structs are filled either way", enforced by nothing.

Every Go consumer moves to the API: the spawn loop, the backlog and RFC pages,
the story pages, the charts. `spawnloop.go:1042` and `rfccharts.go:244` are the
two the CLI's own comments name.

The Go process keeps everything the RFC says it keeps — `/webhooks/github`,
both SSE streams, the tmux work, the spawn loop itself, the `:8081` mux. This
story removes only the hand-written data layer beneath them.

Sequence this before deleting the published JSON: while ringo reads SQLite
directly it does not need `index.json`, but the deletion story wants a single
moment where nothing reads either.

## Acceptance criteria

- `webhook/tasksdb.go` is deleted and no Go code opens `tasks.db`.
- Every page and loop that read it now reads the API, rendering identically.
- ringo degrades visibly rather than silently when the API is unreachable.
- The gitCommonDir resolution mirrored in Go goes with it.
