---
title: "Point /graphs/velocity at the events table instead of the git log"
status: ready
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["serve-the-read-verbs-as-json"]
deps-rfc: []
est-loc: 200
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`/graphs/velocity` needs its own story, because it is the one consumer that
does not read the task database at all — it reads the tasks repo's **git log**.

ringo's README describes it as a timestamped event stream: "Every tasks-CLI
mutation is one commit whose subject is the verb it ran — `new:`,
`status ready:`, `claim:`, `in-progress: <story> #<pr>`, `done:`, `close:`,
`block:`", and counts agents spawned as distinct PR numbers on a week's
`in-progress:` commits.

That description is stale, and the discrepancy has to be resolved before
anything is deleted. Only `tasks new` still commits per mutation
(`authoring.ts:170`); `verbs.ts:5-6` describes the commit-per-mutation flow in
the past tense as the pre-SQLite design; and state now reaches git in hourly
batches as `state: sync N stories` commits from `export`. So the per-verb
subjects the chart parses are mostly no longer produced.

The `events` table is the intended replacement and is already written by every
mutation. Point velocity at it through the API, and the chart stops depending
on commit-message archaeology entirely.

Establish first whether the current chart is already undercounting. If it is,
say so when the fix lands — the weekly figures will move, and that should read
as a correction rather than a regression.

## Acceptance criteria

- `/graphs/velocity` reads the `events` table through the API.
- Whether the git-log source was already undercounting is determined and
  recorded, with the before/after figures.
- Stories created, readied, claimed, done and closed per week, plus agents
  spawned, are derived from events with the same weekly boundaries.
- Nothing in velocity parses commit subjects.
