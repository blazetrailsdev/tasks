---
title: "Route insert_all's scalar VALUES quoting through the adapter and delete quoteSqlValue"
status: closed
updated: 2026-08-18
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
closed-reason: "Already converged: quoteSqlValue and _registerQuoteSqlValue no longer exist anywhere in packages/ or scripts/; insert-all.ts renders VALUES through the adapter path."
---

## Context

`quoteSqlValue` (`packages/activerecord/src/base.ts:341`, `@internal`) has no
Rails counterpart in `base.rb`. Its single consumer is
`packages/activerecord/src/insert-all.ts`, which uses it to render the inline
`VALUES` list:

```ts
return new Nodes.SqlLiteral(quoteSqlValue(value, this._dialect));
```

Rails' `ActiveRecord::InsertAll::Builder#values_list`
(`activerecord/lib/active_record/insert_all.rb`) has no such helper — it goes
through `connection.with_yaml_fallback(type.serialize(value))` and the
adapter's own `quote` / `type_cast`. insert-all.ts already takes the adapter
path for array columns one line above
(`this._insertAll.connection.quote(value)`), so the two branches diverge only
for the scalar case.

Because `quoteSqlValue` lives in base.ts, PR #5775 had to add a
`_registerQuoteSqlValue` push-registration to insert-all.ts to keep base.ts out
of its import cycle. Routing the scalar branch through the adapter's `quote`
would delete the helper, its `@internal` export, the registration function, the
`quoteSqlValue()` guard wrapper in insert-all.ts, and the corresponding
`base.trails.test.ts` block — converging on Rails and shrinking the surface.

## Acceptance criteria

- `insert-all.ts` renders scalar `VALUES` entries through the adapter's
  `quote` / `type_cast` the way Rails' `values_list` does, matching the array
  branch already present at insert-all.ts.
- `quoteSqlValue`, `_registerQuoteSqlValue`, the `quoteSqlValue()` guard
  wrapper and the `_registerQuoteSqlValue(quoteSqlValue)` call at the bottom of
  base.ts are all deleted; `scripts/test-deps/base-import-cycle.test.ts` still
  passes.
- The `quoteSqlValue` describe block in `base.trails.test.ts` is removed or
  relocated to whichever ported method now covers the behaviour; the Temporal,
  bigint, NaN-Date and circular-object cases it covers stay covered.
- `pnpm vitest run packages/activerecord/src/insert-all.test.ts` and the
  postgres/mysql insert_all lanes pass; `parity:api` / `parity:test` delta
  non-negative.
