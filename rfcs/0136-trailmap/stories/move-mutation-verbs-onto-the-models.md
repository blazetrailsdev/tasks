---
title: "Move the mutation verbs off verbs.ts and onto the models"
status: done
updated: 2026-09-05
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["move-task-models-into-trailmap"]
deps-rfc: []
est-loc: 200
priority: 2
pr: 3
claim: "2026-09-05T15:02:07Z"
assignee: "move-ranking-onto-story-scopes"
blocked-by: null
closed-reason: null
---

## Context

`tasks/src/verbs.ts` (290 lines) holds the mutations: `claim`, `release`,
`markTracking`, `recordSpawn`, `block`, `close`, `statusSet`, `setPriority`.
They are free functions that open transactions against the models. In trailmap
they become instance methods on `Story`, which is what they are already
operating on.

Each verb's guards are the interesting part and must move intact — the CLI
refuses `done` on an already-`done` story, no-ops an already-`closed` one, and
only allows `ready` from `draft`. `story.ts` and `story.go` in ringo both
encode adjacent rules; this story is where they get one home.

Every mutation also writes an `events` row. That log is the intended
replacement for the tasks git log as an event stream (see the RFC's open
question on `/graphs/velocity`), so the event write is part of the contract,
not an incidental.

trailmap still does not own the database at the end of this story — these
methods exist and are tested, but the CLI remains the writer until the API
cutover. That keeps this story revertible.

## Acceptance criteria

- Each verb is an instance method or scoped class method on the model, in one
  transaction, with the same guards and the same refusal messages.
- Every mutation writes the `events` row the CLI writes today, with the same
  verb name.
- Tests cover each guard, including the refusals — a `done` story rejecting a
  second `done`, `close` no-opping on an already-closed story.
- The CLI is unchanged and remains the writer.
