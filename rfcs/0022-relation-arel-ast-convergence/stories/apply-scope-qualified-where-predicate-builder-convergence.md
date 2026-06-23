---
title: "Route AssociationScope#applyScope qualified WHERE through predicate builder (drop hand-derived bind)"
status: in-progress
updated: 2026-06-23
rfc: "0022-relation-arel-ast-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3959
claim: "2026-06-23T03:15:15Z"
assignee: "apply-scope-qualified-where-predicate-builder-convergence"
blocked-by: null
---

## Context

In `AssociationScope#applyScope` (packages/activerecord/src/associations/association-scope.ts ~line 339-365), the qualified-table branch (through-JOIN / aliased chain, where `scope.table != table`) hand-builds the Arel predicate node and now re-derives the FK bind by wrapping the value in a `QueryAttribute` keyed by `table.typeForAttribute(key)` (added in PR #3871 to fix PG `varchar = integer`, 42883).

Rails instead routes the qualified case through the predicate builder via `scope.where!(table.name => { key => value })` (activerecord/lib/active_record/associations/association_scope.rb:161-167 — `apply_scope`), so the type-cast bind is produced natively by `PredicateBuilder` rather than re-derived by hand. trails hand-builds the Arel node here because of the existing Arel-for-aliasing choice (so the alias node, not a bare name, qualifies the WHERE), and so re-implements the bind/cast that the predicate-builder path gives for free in the unqualified branch.

Reviewer flagged this on PR #3871 as a pre-existing deviation worth tracking (not a bug — the cast is now correct on all adapters).

## Acceptance criteria

- [ ] `applyScope`'s qualified branch routes the FK/`_type` WHERE through the same predicate-builder bind path as the unqualified `where({ key: value })` branch (or a documented shared helper), eliminating the hand-rolled `QueryAttribute` re-derivation while preserving alias-node qualification.
- [ ] No regression in through / nested-through / self-referential-through association loads on SQLite, PostgreSQL, and MySQL (incl. the string-FK `publication.editors` case from `reload-association-cache.test.ts`).
- [ ] If full convergence isn't feasible given the Arel-for-aliasing constraint, document the residual as tracked-pending-convergence with the specific blocker.
