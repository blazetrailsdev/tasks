---
title: "retire-stale-read-uncommitted-suppression"
status: in-progress
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 10
pr: 7670
claim: "2026-09-10T18:29:19Z"
assignee: "retire-stale-read-uncommitted-suppression"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-live-test.test.ts` is RED on `main` and has been since
`sqlite3-read-uncommitted-shared-cache-skip` (RFC 0119) closed:

```text
"adapters/sqlite3/transaction_test.rb" excludes "opens a `read_uncommitted`
transaction", which packages/activerecord/src/adapters/sqlite3/transaction.test.ts:72
defines as a live test.
```

That story converged the divergence — the test is live at
`packages/activerecord/src/adapters/sqlite3/transaction.test.ts:72`, opening two
connections with `sharedCacheFlags()` and asserting `conn2` sees `conn1`'s
uncommitted INSERT, mirroring
`vendor/rails/activerecord/test/cases/adapters/sqlite3/transaction_test.rb:42-56`
(`SQLite3::Constants::Open::SHAREDCACHE` at `:43,49`).

What it did not do is the last acceptance criterion it set itself: drop the
suppression. The row still stands at
`scripts/parity/unported-files/unscoped.ts:442-448`, under the comment
`// --- Permanently not-portable: single-process SQLite driver limits ---`, and
still claims "better-sqlite3 does not expose this flag, so two connections
cannot share a cache" — which the live test disproves.

Surfaced while enrolling `fixtures_test.rb` in `port-fixtures-test-cases-first-half`
(#7652); the failure reproduces on a clean tree and is unrelated to that PR.

## Converged shape

Delete the row at `scripts/parity/unported-files/unscoped.ts:442-448`. The
guard's own message names the three legal remedies — retire the entry, scope it
with `className`, or record a `liveTsCounterpart` receipt — and retirement is the
right one here, because the TS test at that name IS the Rails test, now passing.

Check whether the sibling row in
`scripts/parity/unported-files/baseline.json` also names it: the closed story's
criteria mention `baseline.json:112-116`, and `unported-files.test.ts:117-134`
requires any retired pre-split entry to be deleted from the baseline in the same
commit.

## Acceptance criteria

- `pnpm vitest run scripts/parity/unported-live-test.test.ts` is green.
- The row naming that test is gone from
  `scripts/parity/unported-files/unscoped.ts`, and from `baseline.json` if it is
  named there.
- `pnpm vitest run scripts/parity` is green as a whole, and
  `pnpm parity:test -- --package activerecord` credits the test rather than
  excluding it.
