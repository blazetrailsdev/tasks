---
title: "Materialize scope join sources via Relation#arel() instead of _joinValues"
status: ready
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In `packages/activerecord/src/associations/join-dependency/join-association.ts`
`joinConstraints` reads `scope._joinValues` directly to materialize the scope's
join sources (raw-string joins → `Nodes.StringJoin`). Rails reads
`arel.join_sources` — the fully-materialized Arel manager output, which always
contains proper Arel join nodes
(`vendor/rails/.../join_dependency/join_association.rb:24-77`).

Reading `_joinValues` (typed `(string | Nodes.Join)[]`, `relation.ts`) is a
necessary approximation because `Relation#arel()` does not exist yet. It handles
raw-SQL strings and pre-built `Nodes.Join`, but an association-name join source
(Rails `.joins(:posts)` in a scope) would be mishandled. A `TODO` marks the site.

## Acceptance criteria

- [ ] Once `Relation#arel()` exists, replace the `scope._joinValues` read in
      `joinConstraints` with `scope.arel().join_sources` (or the trails
      equivalent) so association-name join sources in a scope are handled.
- [ ] Remove the TODO comment at the call site.
- [ ] Existing `test_eager_association_with_scope_with_string_joins` stays green.

This is blocked on `Relation#arel()` / `construct_join_dependency` landing.
