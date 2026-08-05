---
title: "Burn down the 44-file non-transactional row-write ratchet (epic)"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps:
  - row-write-lint-misses-it-each-bodies
deps-rfc: []
est-loc: 400
priority: null
pr: 6124
claim: "2026-08-05T11:59:55Z"
assignee: "burn-down-non-transactional-row-write-ratchet"
blocked-by: null
closed-reason: null
---

## Context

PR #6108 landed `scripts/non-transactional-row-writes.ts`, which flags a
`*.test.ts` under `packages/activerecord/src` that writes rows at `it()` scope
while wiring none of `fixtures(` / `useTransactionalTests(` /
`withTransactionalFixtures(`. It was seeded as a ratchet at **44 files** because
the population was too large to fix in that PR; the gate only prevents growth.

Rails' own `ActiveRecord::TestCase` runs with `use_transactional_tests` on
(vendor/rails/activerecord/lib/active_record/test_fixtures.rb:113, :146), so
every one of those 44 files diverges from the Rails shape. Most are believed
benign — they clean up in `afterEach`, or write to a table nothing else reads —
but "believed benign" is what the pre-#5719 `encryption/encryptable-record.test.ts`
was too, right up until its `downcase: true` book leaked into the
`ignore_case: true` case on all three lanes.

The ratchet is a burndown ledger, not a settled decision. This story is the
burndown.

## Converged shape

For each file in `scripts/non-transactional-row-writes.json`, give it the Rails
shape — `fixtures()` where it can take the endgame surface, otherwise
`useTransactionalTests()` / `withTransactionalFixtures` — and delete its row.
The ratchet is only-shrink, so rows come out one at a time by hand; do not
reseed.

Do NOT reintroduce any part of the global between-test reset removed by #5719
(`resetTestAdapterState` / `resetTestTables`). The fix for a flagged file is
always the Rails shape.

44 files is far more than one PR. Split by directory — the `adapters/*` cluster
(24 files), `connection-adapters/*` (6), `migration/*` + `tasks/*` (5),
`support/*` (3), the rest — and file each split from `main` with
non-overlapping files.

## Acceptance criteria

- [ ] `scripts/non-transactional-row-writes.json` shrinks toward `[]`.
- [ ] Every converged file rides a transactional wrap rather than deleting its
      own rows ad hoc, unless Rails' counterpart genuinely does the latter.
- [ ] No file is removed from the ratchet without a corresponding wrap.
- [ ] Suites green on all three lanes — the leaks this guards are
      lane-specific (#5719's second failure only reproduced on MariaDB).
