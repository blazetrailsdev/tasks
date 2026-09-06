---
title: "Land the ringo read-model deletion: btwebooks has no reviewable remote"
status: draft
updated: 2026-09-06
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

`retire-the-go-read-model` was marked done by trailmap#6, but only its
trailmap half shipped. The Go half — the actual deliverable named in that
story's acceptance criteria — is committed on an unpushed local branch,
`retire-the-go-read-model` in `~/github/deanmarano/btwebooks`, because that
repository has **only a `dokku` remote and no GitHub remote**. There was
nowhere to open a PR.

The branch is complete and green (`go build ./... && go vet ./... && go test
./...`):

- `webhook/tasksdb.go` and `webhook/tasksdb_test.go` deleted (655 lines). No Go
  code opens `tasks.db`; the mirrored `gitCommonDir` resolution goes with it.
- `webhook/tasksapi.go` added: `loadTaskIndex()` / `loadTaskEvents()` over
  `TRAILMAP_URL`, defaulting to `http://127.0.0.1:8080`.
- Consumers moved: `spawnloop.go`'s `loadIndex`, `rfccharts.go`'s
  `readRFCChartIndex`, and the event stream (`TASKS_EVENTS_SOURCE=api`, with
  `db` still accepted as a spelling of it).
- Tests that wrote `index.json` into a temp dir now stand trailmap up
  (`serveTaskIndex`).

The `story` / `rfc` / `taskIndex` / `taskEvent` structs are untouched, and
their field names were diff-checked against `RfcJson` and `StoryJson`: 12/12
and all-but-`stale_days`, which both sides compute at render time.

## Why this is not just "push it"

The endpoints it consumes (`GET /index`, `GET /events`) are live, so the
deletion is safe to land at any time — but it is unreviewed, and pushing to
`dokku` **deploys** rather than proposing. Deciding that is the story: give
btwebooks a GitHub remote so the diff can be reviewed like every other change,
or accept that this repo lands by deploy and say so somewhere durable.

Until it lands, ringo keeps a second read model of `tasks.db` that RFC 0136
exists to delete, and the branch rots against a moving `main`.
