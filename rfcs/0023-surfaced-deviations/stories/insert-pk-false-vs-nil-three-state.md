---
title: "insert() cannot express Rails' pk=false (explicitly no primary key)"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `adapter_prevent_writes_test.rb` on PR #5544.

Rails' `insert` takes `pk` as a three-state argument
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`,
`insert` → `sql_for_insert`):

- `nil` — "not specified", so `sql_for_insert` resolves it:
  `pk = primary_key(table_ref) if pk.nil?`
- `false` — "explicitly no primary key", which skips that lookup and any
  RETURNING clause built from it
- a string — use this column

`adapter_prevent_writes_test.rb` leans on the distinction, calling
`@connection.insert(sql, nil, false)` on every write-prevention case and the
bare `@connection.insert(sql)` on its setup rows.

trails types the parameter as `pk?: string | null`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:490`, and
`insertStatement` in
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:1561`),
so Ruby's `false` is not representable — it collapses into `null`, the same
value that means `nil`. Callers that want "explicitly no primary key" cannot say
so, and on PG that is the difference between emitting a RETURNING clause and
not.

PR #5544 dropped the argument entirely at those call sites, since the
`ReadOnlyError` fires in `preprocessQuery` before any pk resolution and the
outcome is identical either way. That hides the gap rather than closing it.

## Acceptance criteria

- [ ] `insert` / `create` accept Rails' three states for `pk`, distinguishing
      "unspecified" (resolve via `primaryKey(table)`) from "explicitly none"
      (skip the lookup and the RETURNING clause built from it).
- [ ] `sqlForInsert` honours the distinction on PG, where it changes emitted
      SQL; confirm MySQL/SQLite paths are unaffected or updated to match.
- [ ] A regression test asserts the two states produce different SQL on PG.
      It must fail on baseline.
- [ ] Sweep existing `insert(` call sites that pass `null` for `pk` and
      correct any that meant `false`.
- [ ] `api:compare` and `test:compare` deltas >= 0.
