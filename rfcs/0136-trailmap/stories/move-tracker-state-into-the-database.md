---
title: "Move tracker-state.json into the database as pr_states"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["establish-the-shared-sqlite-write-protocol"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`webhook/tracker.go:22`'s `PRState` is a 28-field struct — owner, repo, pr,
branch, title, labels, `mergeConflict`, `behind`, `commentCount`,
`reviewCycles`, `openFindings`, `paneStatus`, `ciStatus`, `pane`, five separate
`*Notified` debounce booleans, `closedSeenAt`, `merged`, `mergedChecked`. Every
one is persisted by marshalling the whole map to an array in
`tracker-state.json` and rewriting the file, under a process-wide
`sync.RWMutex`.

It is a table with a primary key of `(owner, repo, pr)`, stored as a file. It
is also the state behind the dashboard's PR rows, which is why this is the
pilot: it is the largest of the thirteen, the one with real query needs, and
the one that unblocks `render-the-fleet-dashboard-root-page`.

The five `*Notified` booleans deserve attention while porting. Each is a
debounce with a different reset rule stated in its comment —
`CISuccessNotified` is once per PR lifetime and explicitly NOT reset on push,
`CIFailureNotified` and `CyclesExhaustedNotified` are per push cycle. Those
rules are load-bearing (they gate message delivery to panes) and they are
currently documented only in those comments.

## Acceptance criteria

- A `pr_states` table owned by ringo, migrated by trailmap, with the ownership
  registered per `establish-the-shared-sqlite-write-protocol`.
- Every field above is a column with its type, not a JSON blob column. A blob
  column reproduces the problem in a new place.
- The debounce reset rules are preserved exactly and each is covered by a test
  that would fail if the reset semantics changed — they are not derivable from
  the field names.
- A backfill migrates the live `tracker-state.json` and is idempotent.
- `tracker-state.json` is NOT deleted in this story; ringo writes both for one
  soak, and the file is removed by a later story once the table is trusted.
- The whole-map rewrite goes away: a PR's row updates on its own.
