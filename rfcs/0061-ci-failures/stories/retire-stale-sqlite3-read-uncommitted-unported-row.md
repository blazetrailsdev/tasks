---
title: "unported-live-test is red on main: sqlite3 read_uncommitted row claims a live test"
status: draft
updated: 2026-09-10
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-live-test.test.ts` fails on `main`, not just on a
branch. Verified during PR #7655 by stashing the branch's changes on a clean
tree and re-running:

```text
"adapters/sqlite3/transaction_test.rb" excludes "opens a `read_uncommitted`
transaction", which packages/activerecord/src/adapters/sqlite3/transaction.test.ts:72
defines as a live test.
  Retire the entry (and its unported-files/baseline.json row) if the test really
  is ported, scope it with `className`, or record a `liveTsCounterpart` receipt
  saying why the TS test of that name is not the Rails test.
```

The guard's own message names the three remedies. Someone ported the test into
`packages/activerecord/src/adapters/sqlite3/transaction.test.ts:72` without
retiring the matching `tests:` row in `scripts/parity/unported-files/`, so the
case is simultaneously claimed as unported and defined as live — which means
`parity:test` is silently dropping a test that is actually there, understating
the sqlite3 adapter's real credit.

This is a pre-existing red, not #7655's: that PR touched no sqlite3 adapter
file, and the failure reproduces with its diff stashed. It is filed separately
so it is not mistaken for branch noise again — the next agent to run
`pnpm vitest run scripts/parity` will hit it and have to re-derive that it is
not theirs.

## Acceptance criteria

- Read `vendor/rails/activerecord/test/cases/adapters/sqlite3/transaction_test.rb`
  and the TS test at `transaction.test.ts:72`, and decide which of the guard's
  three remedies applies: the row is retired (test really is ported), scoped
  with `className` (a sibling class defines the same description), or given a
  `liveTsCounterpart` receipt (the TS test of that name is a different test).
- If the row is retired, its `scripts/parity/unported-files/baseline.json` row
  is deleted in the same commit.
- `pnpm vitest run scripts/parity/unported-live-test.test.ts` is green on a
  clean tree.
- `parity:test` sqlite3 delta is non-negative and the newly-credited case shows
  under OK.
