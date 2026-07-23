---
title: "alias-tracker-callsites-bypass-relation-alias-tracker"
status: ready
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to relation-alias-tracker-bypasses-class, which converged
`Relation#aliasTracker` (packages/activerecord/src/relation.ts:6469) to Rails'
`AliasTracker.create(model.connection_pool, table.name, joins, aliases)`
(vendor/rails/activerecord/lib/active_record/relation.rb:1307-1309). Four
Rails call sites of `alias_tracker` still construct/read trackers through
bespoke paths in trails (baselined in
scripts/api-compare/call-mismatches-wide-exclude/activerecord/):

- `AssociationScope#scope`
  (packages/activerecord/src/associations/association-scope.ts:288) builds
  `AliasTracker.create(quoter, klass.arelTable.name, [], undefined, quoter)`
  instead of `scope.alias_tracker` (association_scope.rb:26).
- `DisableJoinsAssociationScope#scope` — Rails uses
  `unscoped.alias_tracker` (disable_joins_association_scope.rb:10).
- `JoinDependency#makeConstraints`
  (packages/activerecord/src/associations/join-dependency.ts:1074) reads the
  stored `_aliasTracker` field rather than the `alias_tracker` attr_reader
  path (join_dependency.rb:166,193).
- `buildJoins` (packages/activerecord/src/relation/query-methods.ts:2997)
  uses `buildMergedJoinAliasTracker` instead of
  `alias_tracker(leading_joins + join_nodes, aliases)`
  (query_methods.rb:1894).

## Acceptance criteria

- Each site routes through the converged `Relation#aliasTracker` (or is
  verified equivalent with a call-site justification).
- The four baseline entries naming this story in
  call-mismatches-wide-exclude are removed as sites converge.
