---
title: "Relation redeclares arel_columns/arel_columns_from_hash instead of mixing them in"
status: closed
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Delivered: origin/main packages/activerecord/src/relation.ts no longer declares arelColumns/arelColumnsFromHash as wrapper methods and no longer imports _arelColumns/_arelColumnsFromHash — grep finds only the two Included<> interface declarations at relation.ts:3943/3945 plus two call sites (:1857, :1935). Both helpers now reach Relation through the QueryMethodBangs mixin, exactly the converged shape this story asked for."
---

# `Relation` still redeclares `arel_columns` / `arel_columns_from_hash` instead of mixing them in

## Context

PR 6563 moved three private `QueryMethods` helpers —
`table_name_matches?`, `arel_column`, `arel_column_with_table` — off
`Relation` and onto the `QueryMethodBangs` mixin, because Rails defines them
once in `QueryMethods` and `Relation` gets them by `include`. Redeclaring a
second copy on `Relation` had produced six call-parity rows against bodies
that were only delegating wrappers.

Two siblings were left behind in `packages/activerecord/src/relation.ts`,
still imported as `_arelColumns` / `_arelColumnsFromHash` and re-exposed as
thin methods:

    arelColumns(...)         -> _arelColumns.call(this, ...)
    arelColumnsFromHash(...) -> _arelColumnsFromHash.call(this, ...)

Rails defines both in the same private block as the three already moved:

- `QueryMethods#arel_columns`,
  `activerecord/lib/active_record/relation/query_methods.rb:2016-2027`
- `QueryMethods#arel_columns_from_hash`,
  `relation/query_methods.rb:2029-2050`

`Relation` includes `QueryMethods` (relation.rb:69), so in Rails there is
exactly one definition of each.

## Converged shape

Add `arelColumns` and `arelColumnsFromHash` to the `QueryMethodBangs` export
in `relation/query-methods.ts` and delete the wrapper methods and the
aliased imports from `relation.ts` — the same shape PR 6563 used for the
other three. `Relation`'s interface already extends
`Included<typeof QueryMethodBangs>`, so the types follow automatically.

Check the wrappers for behaviour the canonical bodies lack before deleting:
the `arelColumn` wrapper removed in 6563 had an extra
`if (field instanceof Nodes.Node) return field` short-circuit that dropped
the canonical body's fallback arm. If either of these two has similar
drift, that drift is the bug.

## Acceptance criteria

- [ ] Both helpers live only in `relation/query-methods.ts` and reach
      `Relation` through the mixin.
- [ ] Any call rows this retires are deleted by hand (via
      `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api` method total does not drop — both stay matched via
      `relation/query-methods.ts`.
- [ ] All three adapter lanes green.
