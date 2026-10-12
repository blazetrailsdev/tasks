---
title: "Query and schema parity jobs run on a PR that touches their inputs, without the run-parity-sqlite label"
status: draft
updated: 2026-10-12
rfc: "0061-ci-failures"
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

`Query Parity (diff)` went red on trails `main` at `9f1d0ab8` (story
`red-9f1d0ab8`, fixed by trails#8817). The break was introduced three days
earlier by trails#8733, which changed `WhereChain#associated` / `#missing` in
`packages/activerecord/src/relation/query-methods.ts` to take the association
Symbol (`":author"`) and left `scripts/parity/pipeline/fixtures/ar-36/query.ts`
and `ar-37/query.ts` passing `"author"`. That PR's CI was green.

It was green because the parity jobs do not run on a pull request unless it is
labelled. In `.github/workflows/ci.yml`, the `changes` job's filter step sets
`parity_sqlite` from the event name alone:

- `schedule` / `workflow_dispatch`: `true`.
- `pull_request`: `true` only when the PR carries the `run-parity-sqlite`
  label.
- anything else: `false`.

Every `schema-parity-*` and `query-parity-*` job is gated on
`needs.changes.outputs.parity_sqlite == 'true'`. So a PR that changes
`packages/activerecord/src/relation/**`, `packages/arel/src/**` or
`scripts/parity/pipeline/**` merges without the query diff ever running, and
the red appears later on `main`, where it pauses the spawn loop. trails#8817
itself, a change to two parity fixtures, skipped all four Query Parity jobs
until the label was added by hand.

## Acceptance criteria

- On a `pull_request` event, `parity_sqlite` is `true` when the changed files
  touch the parity pipeline's inputs, without a label: at least
  `scripts/parity/pipeline/**` and the activerecord and arel sources the
  trails-side dump builds (`pnpm --filter "@blazetrails/activerecord..." build`
  names the closure).
- The `run-parity-sqlite` label still forces the jobs on for any PR.
- A PR touching none of those paths still skips the parity jobs, and the final
  `CI` job does not report them as unexpectedly skipped.
- The `changes` job's `run:` script stays under the Actions size limit; put
  new logic in a `scripts/ci/` file if it does not fit.
