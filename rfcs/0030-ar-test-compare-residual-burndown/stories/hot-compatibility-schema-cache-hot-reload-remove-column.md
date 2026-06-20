---
title: "Hot-compatibility insert/update after remove_column (schema-cache hot-reload)"
status: claimed
updated: 2026-06-20
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-06-20T20:07:28Z"
assignee: "hot-compatibility-schema-cache-hot-reload-remove-column"
blocked-by: null
---

## Context

`packages/activerecord/src/hot-compatibility.test.ts` still has two
`it.skip` tests after #3737 un-skipped the prepared-statement-cache-expired
pair:

- "insert after remove_column" (Rails `hot_compatibility_test.rb:25-43`)
- "update after remove_column" (Rails `hot_compatibility_test.rb:45-57`)

Both exercise schema-cache hot-reload: warm the column cache, `remove_column`
via the connection, assert the model still reports the stale column count
(`@klass.columns.length == 3`), yet INSERT/UPDATE still succeed as long as the
removed column isn't referenced (Rails relies on the cached column list driving
the write SQL so the dropped column is simply omitted).

Requires the model's schema cache to stay warm/stale across a `remove_column`
and the write path to build SQL from the cached columns rather than re-reading
the live table.

## Acceptance criteria

- [ ] Drop both `it.skip()`; tests run on all adapters (Rails does not gate them).
- [ ] `remove_column` leaves the warmed column cache stale (count unchanged).
- [ ] INSERT/UPDATE succeed using cached columns, omitting the dropped column.
- [ ] `test:compare` delta non-negative; test names unchanged.
