---
title: "PG: preload initialize_type_map's OIDs and delete the getOidType reentrancy guard"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6313
claim: "2026-08-10T00:10:55Z"
assignee: "port-test-date-arith-operators"
blocked-by: null
closed-reason: null
---

## Context

PR #6295 added a reentrancy guard to `PostgreSQLAdapter#getOidType`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`): a
`_loadingAdditionalTypes` flag that makes a type-map miss return an
unregistered `ValueType` instead of re-entering `loadAdditionalTypes`.

That branch has no Rails counterpart. Rails cannot reach the cycle at all
because `initialize_type_map` preloads the common OIDs at connect
(`activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:558-608`),
so `get_oid_type` for pg_type's own columns (oid/name/bool/text) never misses
and `load_additional_types` is never called from inside itself. Rails'
`get_oid_type` is just:

```ruby
def get_oid_type(oid, fmod, column_name, sql_type = "")
  load_additional_types([oid]) unless type_map.key?(oid)
  type_map.fetch(oid, fmod, sql_type) { ... }
end
```

(`postgresql_adapter.rb:820-830`)

trails populates the map lazily, which is what makes the cycle
`schemaQuery -> internalExecQuery -> castResult -> getOidType ->
loadAdditionalTypes -> schemaQuery` reachable. The guard is a workaround for
the lazy population, not a port of anything.

The original story (`pg-cast-result-oid-lookup-reentrancy-guard`) named the
preload as "the more faithful fix"; #6295 shipped the guard and left the
preload undone.

## Converged shape

Preload the OID set Rails' `initialize_type_map` registers at connect so the
miss cannot happen, then delete `_loadingAdditionalTypes` and the guard branch
in `getOidType`, leaving the Rails two-line body.

Note the existing eager load in `_maybeConfigureConnection`
(`_eagerLoadAdditionalTypes`) already runs a full `load_additional_types` on the
raw socket; the question is whether it covers the OIDs Rails seeds
synchronously and why a miss is still reachable after it.

## Acceptance criteria

- [ ] `getOidType`'s body matches Rails' — a `load_additional_types([oid])`
      on miss and a `type_map.fetch`, with no reentrancy branch.
- [ ] `_loadingAdditionalTypes` is gone.
- [ ] No poisoning fallback is registered on the type map (see the comment at
      postgresql-adapter.ts lookupCastTypeFromColumn).
- [ ] The regression test added by #6295
      ("getOidType does not re-enter loadAdditionalTypes") is replaced by one
      proving the preload makes the miss unreachable, and still fails on a
      baseline that recurses.
- [ ] Verified on a live PG lane.
