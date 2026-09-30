---
title: "query-methods and merger read ActiveRecord::Associations::JoinDependency at call time"
status: done
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8277
claim: "2026-09-30T13:06:35Z"
assignee: "anonymous-migration-class-name-is-empty-string-not-nil"
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency` is now an Autoload class seated on `Associations`
(trails#8193), but `relation/query-methods.ts` and `relation/merger.ts` still
reach it through a plain runtime import of `associations/join-dependency.js`.

Rails resolves it at call time:

- `ActiveRecord::Associations::JoinDependency.new(...)` in
  `construct_join_dependency` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_methods.rb:1599`)
- `when ActiveRecord::Associations::JoinDependency` (`query_methods.rb:1816`)
  and `joins.last.is_a?(ActiveRecord::Associations::JoinDependency)` (`:1848`)

The eager import is a real cycle:
`join-dependency/join-association.ts -> relation/query-methods.ts -> relation.ts
-> relation/spawn-methods.ts -> relation/merger.ts -> associations/join-dependency.ts`.
Importing built `dist/associations/join-dependency/join-association.js` or
`dist/relation/query-methods.js` as the entry module in plain node TDZs, and it
did so on `main` before #8193 too (`QueryMethods` in `relation.js`). Once
`JoinDependency` seats `JoinAssociation` at module scope, the `join-association`
entry TDZs on `JoinAssociation` as well.

`merger.ts` `mergeOuterJoins` partitions `left_outer_joins_values` with
`instanceof JoinDependency`. Rails' `merge_outer_joins`
(`relation/merger.rb:136-153`) partitions on `when Hash, Symbol, Array`, the same
shape `merge_joins` (`:117-134`) uses and trails' `mergeJoins` already follows.

## Acceptance criteria

- `query-methods.ts` reads `Associations.JoinDependency` at call time at the
  three Rails sites and imports `JoinDependency` type-only.
- `merger.ts` `mergeOuterJoins` partitions as `merger.rb:141-145` does, and no
  longer imports `JoinDependency` at runtime.
- Something still loads `associations/join-dependency.js` eagerly (for example
  `associations.ts`, as the other `eager_autoload` association classes are loaded).
- A plain-node import of built `dist/associations/join-dependency/join-association.js`
  and `dist/relation/query-methods.js` as entry modules does not TDZ.
