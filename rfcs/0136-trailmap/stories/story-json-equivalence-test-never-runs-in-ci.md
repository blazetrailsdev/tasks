---
title: "trailmap: the index.json equivalence test still runs only on the box, because CI has no published index.json"
status: in-progress
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#88
claim: "2026-10-28T12:04:01Z"
assignee: "port-pr-82-to-the-rails-twin"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to trailmap#68, which put the `TASKS_DATABASE`-gated tests into CI's
`gate` job. One was left out on purpose: `test/serializers/story-json.test.ts`,
"the published index.json". It diffs the serializer's output against
`<tasks checkout>/index.json`, which the CLI publishes beside a live checkout
and which is untracked, so it does not exist in the `gate` job (the database
there is `tmp/ci-tasks.db`, and the test looks for `index.json` two
directories above it). It still runs only on the box, which is the same
silent-skip shape that let three tests rot.

## Acceptance criteria

- The field-for-field comparison runs on every PR. Either the `gate` job has
  the tasks CLI publish an `index.json` from the ingested database and the test
  is pointed at it, or the test compares against the CLI's JSON output directly
  rather than a file beside the database.
- The test finds its `index.json` from an explicit setting, not by walking up
  from `TASKS_DATABASE`.
- If neither is workable, the test's header and `.github/workflows/ci.yml` say
  why, as they do now.
