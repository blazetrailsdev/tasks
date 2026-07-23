---
title: "create_or_find_by rescue reads ad-hoc _conn(), not a with_connection lease"
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

Surfaced by PR #5138 (residual-skip-tail-sweep). Rails wraps the whole of
`create_or_find_by` / `create_or_find_by!` in `with_connection do |connection|`
(`vendor/rails/activerecord/lib/active_record/relation.rb:273-283` / `:288-298`)
so the `transaction_open?` rescue check reads the _leased_ connection. trails'
`Relation#createOrFindBy` (`packages/activerecord/src/relation.ts`, rescue arm)
and `performCreateOrFindByBang`
(`packages/activerecord/src/relation/finder-methods.ts`) call
`this._conn().isTransactionOpen()` ad hoc at rescue time instead — no
`with_connection` lease bracket around the create+rescue pair. Under the pool
async/sync convergence campaign (`with_connection` shim) this can read a
different connection than the one the failed INSERT ran on.

## Acceptance criteria

- `createOrFindBy` / `performCreateOrFindByBang` bracket the
  transaction+rescue in the with_connection equivalent, checking
  `isTransactionOpen()` on that leased connection, mirroring
  relation.rb:273-283/288-298.
- Existing findOrCreateBy race/retry tests stay green.
