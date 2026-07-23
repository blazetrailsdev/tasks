---
title: "Drop stale deadlock-test exclusions from unported-files.ts (PG siblings already ported)"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
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

PR #5121 removed the MySQL concurrency exclusions from `scripts/api-compare/unported-files.ts` because both files are now ported. The PG siblings remain listed even though their tests were ported long ago: `adapters/postgresql/transaction_nested_test.rb` (entry excludes "deadlock inside nested SavepointTransaction is recoverable" and "deadlock raises Deadlocked inside nested SavepointTransaction" — both exist in `packages/activerecord/src/adapters/postgresql/transaction-nested.test.ts:120-143`). Also stale-suspect: `adapters/postgresql/transaction_test.rb` / `adapters/abstract_mysql_adapter/transaction_test.rb` entries excluding "raises Deadlocked when a deadlock is encountered" — verify against the ported transaction test files before dropping. The comment block that claimed MySQL/PG entries must stay "balanced" for the shared-test detector was removed with the MySQL entries; confirm no detector regression.

## Acceptance criteria

- Every unported-files.ts exclusion whose tests are actually ported is removed; genuinely unported ones stay with accurate reasons.
- test:compare and api:compare deltas non-negative.
