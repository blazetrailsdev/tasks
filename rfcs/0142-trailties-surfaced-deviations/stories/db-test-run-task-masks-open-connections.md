---
title: "db.test.ts runTask clears connections before tests assert none are open"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/test/commands/db.test.ts` `runTask` ends with
`await Base.connectionHandler.clearAllConnectionsBang()` in its `finally`.
Any assertion made after `runTask` that "no pool is connected" therefore
passes whether or not the task disconnected. `db seed reaches a model on the
second database through the connection an initializer established, and
closes it` asserts exactly that and was a false green: trails' `db:seed`
left an initializer's pool open (trailmap's `pnpm db:seed` hung) while the
test passed. The real fix landed in `RakeCommand.perform` (trails#10370),
which this harness does not go through.

## Acceptance criteria

- Either drop the "and closes it" claim and its assertion from that test
  (rename to what it actually checks), or make the harness stop clearing
  connections before the test asserts, with the cleanup moved to `afterEach`.
- `leaves no connection open after the command finishes` in the same file
  is checked the same way and fixed if it has the same masking.
