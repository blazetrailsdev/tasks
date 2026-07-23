---
title: "transactions-residual-skips"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`transactions.test.ts` carries 4 counted skips (of its 11 `it.skip`s — the
rest are already classified out as thread/fork-bound). Candidates among the
live skips: :380 (rollback dirty changes then retry save on new record with
autosave association), :470 (throw from transaction commits), :587/:592
(update should rollback on failure / failure!), :453 (deprecation on ruby
timeout outside inner transaction), :1553 (prepared statement materializes
transaction). Rails:
`vendor/rails/activerecord/test/cases/transactions_test.rb`. Identify which 4
test:compare counts (run `--incomplete` and cross-reference), read each Rails
test, un-skip the portable ones, reclassify the rest.

## Acceptance criteria

- The 4 counted transaction skips are passing un-skipped or reclassified.
- `--incomplete` Skip count for transactions_test.rb reaches 0.
