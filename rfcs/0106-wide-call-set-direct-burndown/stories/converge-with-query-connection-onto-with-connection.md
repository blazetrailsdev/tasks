---
title: "internal query paths call _withQueryConnection where Rails calls model.with_connection"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6570
claim: "2026-08-15T17:15:05Z"
assignee: "converge-with-query-connection-onto-with-connection"
blocked-by: null
closed-reason: null
---

## Context

`Relation#ids` and `#pluck` end their query arm inside
`model.with_connection { |c| c.select_all(...) }`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:392-400`,
`:311-320`). trails spells that as `this._withQueryConnection(() => ...)`
(`packages/activerecord/src/relation.ts`, `_withQueryConnection` →
`withQueryConnection(model, run)` in `connection-handling.ts`), which is the same
block-scoped lease but under a different name, so the call-set comparator sees the
Rails `with_connection` call as missing.

Surviving rows (PR #6564 converged the rest of the `relation/calculations.rb`
cluster but could not converge these, since renaming the helper is a file-wide
change well outside a single story):

```text
scripts/api-compare/call-mismatches-exclude/activerecord/relation.json
  ids                          with_connection
  select_for_count             with_connection
  execute_simple_calculation   with_connection
  execute_grouped_calculation  with_connection
```

Same cause in every row: a leading `_` and a `Query` infix on a method whose Rails
name is `with_connection`.

## Converged shape

`Model.withConnection` already exists on the class
(`packages/activerecord/src/relation.ts:7507`, `connection-handling.ts`), which is
the direct mirror of Ruby `model.with_connection`. Route the internal query paths
through it — `this.model.withConnection((c) => ...)` — instead of the privately
named `_withQueryConnection`, or rename the private helper to the Rails name and
keep the pool-identity guard inside it. Either way the call site should read as
`with_connection` to a Rails dev and to the extractor.

Check `threadedConnectionFor`'s pool-identity guard survives the move: it is what
keeps a cross-pool outer wrap from handing a model a foreign connection, and it is
the reason the private wrapper exists at all.

## Acceptance criteria

- [ ] The four `with_connection` rows above are deleted, not re-justified.
- [ ] No new call-SET or call-ARG rows in `relation.json` / `relation/calculations.json`.
- [ ] SQLite, PG and MySQL/MariaDB green (the guard is only exercised under a real pool).
