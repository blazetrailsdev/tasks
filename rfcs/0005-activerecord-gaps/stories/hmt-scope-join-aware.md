---
title: "Make HMT scope() join-aware like Rails"
status: ready
rfc: "0005-activerecord-gaps"
cluster: associations
deps: []
deps-rfc: []
est-loc: 15
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`throughScopeAttributes` (`has-many-through-association.ts:428`) uses
`throughScope(assoc) ?? (assoc as any).scope?.()` (line 445) to extract
through-table WHERE conditions. The `scope?.()` fallback calls `Association#scope()`
(`association.ts:105-106`), which delegates to `buildHasManyRelation` — a
direct-FK WHERE clause (`SELECT tags.* WHERE tags.user_id = ?`). For HMT this
targets the wrong table (the FK lives on the join table, not the target) so
`whereValuesHash(throughTable)` returns `{}` and no through-scope attributes are
applied to built join records.

Rails' equivalent — `through_scope || self.scope`
(`activerecord/lib/active_record/associations/has_many_through_association.rb`,
private `through_scope_attributes`) — uses `self.scope`, which is the full
JOIN-aware `AssociationScope` relation. The fix is to change the fallback from
`assoc.scope?.()` to `assoc.associationScope?.()` (the JOIN-based method at
`association.ts:138`).

The non-join-aware `scope()` is also why `idsReader` is overridden
(`has-many-through-association.ts:85`) — `scope().pluck(pk)` gives
"no such column: target.owner_id". That override is an acceptable workaround;
this story targets only the `throughScopeAttributes` fallback.

## Acceptance criteria

- [ ] `throughScopeAttributes` uses `associationScope()` (join-aware) as the
      fallback when `_throughScope` is null, matching Rails' `self.scope`
- [ ] Existing HMT scope tests stay green

## Notes

From the associations gap plan (Round-4 follow-up), ready now. ~15 LOC.
