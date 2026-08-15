---
title: "Port Relation#ids' three Rails arms instead of delegating to pluck"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6565
claim: "2026-08-15T14:14:32Z"
assignee: "call-recorder-matches-bodiless-interface-declarations"
blocked-by: null
closed-reason: null
---

## Context

`Relation#ids` in trails (`packages/activerecord/src/relation.ts`, `async ids()`)
is a one-line delegation:

```ts
async ids(): Promise<unknown[]> {
  return this.pluck(this.model.primaryKey as string);
}
```

Rails' body (`activerecord/lib/active_record/relation/calculations.rb:371-405`)
is not that. It:

1. widens the primary key with `Array(primary_key)` and reads the values off
   loaded records via `_read_attribute` when `loaded?`, wrapping in
   `Promise::Complete` under `@async` (`:374-383`);
2. recurses through `apply_join_dependency.group(*primary_key_array)` when
   `has_include?(primary_key)` (`:385-388`);
3. otherwise spawns, sets `select_values` to `arel_columns(primary_key_array)`
   and takes `ActiveRecord::Result.empty` for a contradictory where-clause
   (`:394-395`).

The delegation gets the common case right but drops the composite-primary-key
arm (`Array(primary_key)` + the per-column map), the `loaded?` fast path and the
`has_include?` grouping. It was surfaced by the `relation.ts / ids / empty`
call-set row during the RFC 0106 burndown of the `Result.empty(async:)` rows
(PR #6559); that row is gone now only because `pluck`'s own `Result.empty` arm
converged, not because `ids` did.

## Converged shape

`Relation#ids` ports `calculations.rb:371-405` arm for arm — the
`primary_key_array` local, the `loaded?` branch reading `_read_attribute` per
column, the `has_include?` recursion, and the contradiction arm returning
`Result.empty` — rather than delegating to `pluck`.

## Acceptance criteria

- [ ] `ids` has the three Rails arms, with the Rails locals and branch order.
- [ ] The composite-primary-key arm returns an array of arrays, one per column,
      as `:379` does.
- [ ] `pnpm parity:api:calls` stays green; no new baseline rows.
