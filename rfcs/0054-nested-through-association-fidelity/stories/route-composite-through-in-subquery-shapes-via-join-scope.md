---
title: "Route remaining composite has_many :through shapes through the JOIN scope instead of throwing"
status: done
updated: 2026-07-08
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 25
pr: 4744
claim: "2026-07-07T15:49:50Z"
assignee: "route-composite-through-in-subquery-shapes-via-join-scope"
blocked-by: null
closed-reason: null
---

## Context

PR #4491 (hmt-unskip-no-pk-cpk) routed ONE composite-through shape — a
composite foreign key on a `hasMany` source — through the JOIN-based
`buildThroughJoinScope` instead of throwing, so CPK
`has_many :chapters, through: :book` builds and queries correctly (composite
ON clause). See `packages/activerecord/src/associations/collection-proxy.ts`
`_buildThroughScope`, the `if (Array.isArray(sourceFk))` branch (~line 3562).

Three sibling composite shapes in the same IN-subquery fallback still throw
`ConfigurationError` rather than routing through the JOIN scope:

1. Composite belongsTo-source FK — `collection-proxy.ts:~3520`
   ("does not support a composite foreign key on the source belongsTo").
2. Composite-PK target with no scalar source primaryKey —
   `collection-proxy.ts:~3535` ("has a composite-PK target ... but no scalar
   primaryKey ... to anchor the IN-subquery").
3. Composite through-model PK — `collection-proxy.ts:~3587`
   ("does not support a composite primary key on the through model").

Rails builds all of these via the general chain-based `AssociationScope`
(composite ON clauses), which `buildThroughJoinScope`
(`associations.ts:2243`) already wraps. The top-of-function gate
(`_buildThroughScope`, ~line 3440) still excludes `ownerPkComposite ||
targetPkComposite` from the join route, forcing these into the throwing
fallback.

## Acceptance criteria

- [ ] Composite belongsTo-source-FK through associations route through
      `buildThroughJoinScope` (or otherwise build a correct composite scope)
      instead of throwing.
- [ ] Composite-PK target without a scalar source primaryKey builds a correct
      composite scope instead of throwing.
- [ ] Composite through-model PK builds a correct composite scope instead of
      throwing.
- [ ] Assert generated JOIN SQL contains the full composite ON clause for each
      shape, under SQLite/PG/MariaDB.
- [ ] Update / remove the `_buildThroughScope` top-gate composite exclusion and
      its comment as each shape moves onto the join route.
- [ ] No regressions in has-many-through / has-one-through / composite
      disable-joins suites.
