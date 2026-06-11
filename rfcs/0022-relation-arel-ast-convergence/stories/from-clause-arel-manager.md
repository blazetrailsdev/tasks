---
title: "from(): set FROM on the arel manager pre-compile (build_from), drop the regex rewrite"
status: draft
updated: 2026-06-10
rfc: "0022-relation-arel-ast-convergence"
cluster: from
deps: []
deps-rfc: []
est-loc: 400
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Cluster 3 of the RFC. trails applies `from()` by **regex-replacing the FROM
clause of the already-compiled SQL** (relation.ts ~L4068):

```ts
sql = sql.replace(/FROM\s+(?:"[^"]+"|`[^`]+`)(?:\.(?:"[^"]+"|`[^`]+`))*/, () => `FROM ${fromExpr}`);
```

with `fromExpr` built either from a raw string + optional alias, or from a
compiled subquery whose binds are then prepended onto `_lastSelectBinds`
(~L4055–4059). Because FROM is applied post-compilation, it never reaches the
arel manager — so `pluck` (which builds its own manager off `arel_table`) ignores
it entirely (addressed in the follow-on `pluck-from-cte-threading`).

Rails sets FROM on the manager **before** compilation via `build_from`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb` L1783):

```ruby
def build_from
  opts = from_clause.value
  name = from_clause.name
  case opts
  when Relation
    opts = opts.apply_join_dependency if opts.eager_loading?
    name ||= "subquery"
    opts.arel.as(name.to_s)
  else
    opts
  end
end
```

The arel manager already supports this: `SelectManager#from`.

## Scope

- Port `build_from`: when building the SELECT manager, set FROM on the manager
  (`arel.from(opts)`; for a Relation value, `opts.arel.as(name)` with `name`
  defaulting to `"subquery"`) instead of regex-replacing the compiled SQL.
- Remove the `sql.replace(/FROM …/, …)` rewrite and the explicit
  `[...fromBinds, ...selectBinds]` prepend — subquery binds now flow through the
  manager's collector in document order.
- Confirm `from()` flows through `toArray` and `count` (both build from the
  manager). `pluck` is handled in the follow-on story.
- Preserve identifier quoting for string FROM values (ANSI `"…"` / MySQL
  backticks) by routing through the visitor's table/column quoting rather than the
  hand-written regex.

## Rails source

- `query_methods.rb` `build_from` (L1783) and `from`/`from!` (L1391/L1395).
- arel `SelectManager#from`.

## Test assertions

- `vendor/rails/activerecord/test/cases/relation/from_test.rb` (`FromTest`) —
  `from("…")` string, `from(relation, alias)` subquery, FROM with WHERE binds,
  and `from` combined with `select`/`order`/`count`.
- trails mirror under `packages/activerecord/src/relation/` for `from()`.

## Acceptance criteria

- [ ] FROM is set on the arel manager pre-compile; the `sql.replace(/FROM …/)`
      rewrite and manual bind prepend are removed.
- [ ] `from("table alias")`, `from(subquery, name)`, and `from` + WHERE binds all
      compile correctly on SQLite / PG / MySQL (quoting via the visitor).
- [ ] `from()` is honored by `toArray` and `count`. Existing `from` tests pass; no
      test renames; `test:compare` for `from_test.rb` delta ≥ 0.

## Notes

- Watch bind ordering: the old code explicitly prepended FROM-subquery binds
  before WHERE binds (relation.ts ~L4059). With FROM on the manager the collector
  produces this ordering naturally — verify on PG with a parameterized subquery
  (RFC open question 1).
