---
title: "Land the ringo read-model deletion: btwebooks has no reviewable remote"
status: blocked
updated: 2026-09-09
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
blocked-by: "Changes the live workflow: repoints ringo's loadIndex/rfccharts/event stream at trailmap's API and deletes tasksdb.go. Held until snapshot-the-show-page-equivalence-before-it-goes-circular has recorded the independent show-page fixture, and until btwebooks has a reviewable GitHub remote."
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

## Ordering: the show-page fixture is recorded first, and it already is

This story is what makes `pnpm gate:pages` stop meaning anything. Once ringo's
`loadIndex` reads trailmap's `GET /index`, ringo's `HandleRFCPage` and
`HandleStoryPage` render from data trailmap produced, and the gate that
compares the two keeps reporting EQUIVALENT while comparing trailmap against
itself. It goes circular, not red — which is worse than losing it, because the
green check keeps being cited as the evidence the show pages were verified.

`snapshot-the-show-page-equivalence-before-it-goes-circular` closed that window
first. trailmap now carries a recording of what ringo's pages SAID, made while
ringo still had its own read model — 8,953 pages, no differences, 4,747 of them
the story pages ringo hides under a closed RFC and trailmap serves — replayed
in CI by `pnpm gate:snapshot` with no ringo present:

- `test/fixtures/ringo-show-pages.ndjson`, ringo's extracted facts per page
- `test/fixtures/ringo-show-pages-rows.ndjson`, the database rows they were
  rendered from, because the live database moves under the fixture otherwise

So the ordering constraint this story was held on is satisfied. What survives
the deletion is the recording; what does not is the ability to make a new one,
since an equivalent run against a ringo reading trailmap's own API proves
nothing. Re-recording after this lands is not possible, and trailmap's README
("The recorded show-page snapshot, and when to re-record it") says so.
