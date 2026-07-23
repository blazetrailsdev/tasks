---
title: "count() must compile select values via select_for_count (raise on invalid columns)"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `select_for_count` (vendor/rails/activerecord/lib/active_record/relation/calculations.rb:645-653) compiles ALL select values via `arel_columns` and counts that projection; with raw multi-column SQL fragments (`select("credit_limit, firm_name").count`) PG/MySQL raise StatementInvalid (migration counterpart: calculations_test.rb `test_count_on_invalid_columns_raises`). trails' count paths (packages/activerecord/src/relation/calculations.ts, performCount) only inherit a select value as the count column when there is exactly ONE select value that is an Arel node or (since #5128, limited path only) a plain-identifier string; everything else silently degrades to COUNT(\*). The non-limited path still ignores plain-string selects entirely, `selectForCount` at calculations.ts:1498 is an orphan helper, and `calculations.test.ts` "count on invalid columns raises" only asserts a number is returned instead of the Rails raise.

## Acceptance criteria

- Non-limited `count()` honors a single string select value as the counted column (parity with the limited path fixed in #5128).
- Multi-value / raw-fragment select values compile through the arel_columns analogue like Rails' select_for_count — including the PG/MySQL StatementInvalid raise for invalid aggregates — or a documented call-site deviation.
- `calculations.test.ts` "count on invalid columns raises" restored to Rails' assert_raises(StatementInvalid) on adapters where Rails raises.
- Orphan `selectForCount` helper either wired into the count paths or deleted.
