---
title: "reverseOrder() on no-PK table should raise IrreversibleOrderError"
status: ready
updated: 2026-06-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/rails/activerecord/test/cases/relations_test.rb:367` — `Edge.all.reverse_order` raises `IrreversibleOrderError` because `Edge` has no primary key (`primaryKey: false` in TEST_SCHEMA).

In Trails, `Relation#reverseOrder()` does not check for a missing primary key; it silently generates SQL with no ORDER BY instead of throwing. Surfaced in `relations.test.ts` canonical port (PR #4215); test is currently skipped with `BLOCKED:` comment.

`packages/activerecord/src/relations.test.ts` — skip: "reverseOrder() doesn't check for missing PK yet"

## Acceptance criteria

- `Edge.all().reverseOrder()` (or `.reverseOrder().toSql()`) throws `IrreversibleOrderError`
- Existing `reverse_order` tests on PK-bearing tables continue to pass
- The skip on `default reverse order on table without primary key` in `relations.test.ts` is removed and the test passes on all three adapters
