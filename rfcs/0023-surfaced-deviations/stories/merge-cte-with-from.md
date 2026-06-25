---
title: "merge-cte-with-from"
status: ready
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: rails-deviation
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Merging relations that carry `with(...)` CTE definitions does not fold the
other relation's CTEs into the merged result, so the merged query references an
undefined CTE alias (e.g. `no such table: posts_with_tags`). The merger needs
to union CTE values like Rails' Merger does.

Surfaced by the faithful port of `relation/merging_test.rb` (the three
`supports_common_table_expressions?`-guarded tests), `it.skip` in
packages/activerecord/src/relation/merging.test.ts with this slug.

Impl: packages/activerecord/src/relation/merger.ts (no CTE merge) + relation
`with`/CTE plumbing. Rails ref:
vendor/rails/activerecord/lib/active_record/relation/merger.rb.

## Acceptance criteria

- [ ] Merger folds the other relation's CTE (`with`) values into the result.
- [ ] Un-skip the three CTE merge tests; they pass (the same-alias one still
      surfaces the DB error it asserts).
