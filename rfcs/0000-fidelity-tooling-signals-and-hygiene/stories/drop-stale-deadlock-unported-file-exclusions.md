---
title: "Drop stale deadlock-test exclusions from unported-files.ts (PG siblings already ported)"
status: ready
updated: 2026-07-27
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5121 removed the MySQL concurrency exclusions from `scripts/api-compare/unported-files.ts` because both files are now ported. The PG siblings remain listed even though their tests were ported long ago: `adapters/postgresql/transaction_nested_test.rb` (entry excludes "deadlock inside nested SavepointTransaction is recoverable" and "deadlock raises Deadlocked inside nested SavepointTransaction" — both exist in `packages/activerecord/src/adapters/postgresql/transaction-nested.test.ts:120-143`). Also stale-suspect: `adapters/postgresql/transaction_test.rb` / `adapters/abstract_mysql_adapter/transaction_test.rb` entries excluding "raises Deadlocked when a deadlock is encountered" — verify against the ported transaction test files before dropping. The comment block that claimed MySQL/PG entries must stay "balanced" for the shared-test detector was removed with the MySQL entries; confirm no detector regression.

## Acceptance criteria

- Every unported-files.ts exclusion whose tests are actually ported is removed; genuinely unported ones stay with accurate reasons.
- parity:test and parity:api deltas non-negative.

## Path refresh — 2026-08-17

Citations in this body predate the RFC 0092 `parity:*` consolidation, which moved
several modules out of `scripts/api-compare/` into `scripts/parity/`. Verified
current locations:

- `scripts/api-compare/unported-files.ts` -> `scripts/parity/unported-files/`

## Re-verified 2026-08-17 (ready sweep)

`scripts/api-compare/unported-files.ts` is now the directory
`scripts/parity/unported-files/` (per-package `.ts` files plus `baseline.json`).
The exclusion entries this story prunes live in the per-package files there —
re-locate the PG transaction entries before starting; the claim that the tests
are ported still needs the same file-by-file check the body describes.
