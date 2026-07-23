---
title: "Retire buildBindAttribute's relation param and its wide-gate baseline once the builder is TableMetadata-backed"
status: in-progress
updated: 2026-07-23
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps:
  - predicate-builder-table-is-arel-table-not-tablemetadata
deps-rfc: []
est-loc: 40
priority: 65
pr: 5103
claim: "2026-07-23T00:43:32Z"
assignee: "retire-predicate-builder-relation-param-and-wide-gate-baseline"
blocked-by: null
closed-reason: null
---

## Context

Debt deliberately incurred by PR #4963 (story
`unify-predicate-builder-type-resolution-cascades`). That PR unified the three
duplicate type-resolution cascades into one `_resolveTypeBy` and typed the
positive equality bind through it. Both artifacts below are _adaptations_ that
exist only because trails cannot yet do what Rails does; each becomes dead the
moment the builder is TableMetadata-backed, and neither is self-announcing.

1. `PredicateBuilder#buildBindAttribute` gained an optional third `relation`
   argument (`relation/predicate-builder.ts`). Rails'
   `build_bind_attribute(column_name, value)` is strictly 2-arg
   (`vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:67-68`)
   and gets the joined/aliased type for free because Rails re-roots
   `PredicateBuilder#table` per association. `BasicObjectHandler` and the
   tuple-equality path both pass the attribute's relation explicitly.

2. Two entries in
   `scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation/predicate-builder.json`
   baseline `build_bind_attribute` -> `table` and -> `type`. The first was added
   by #4963 because the `this.table.typeForAttribute` read moved into the shared
   resolver, where the name-based wide gate cannot see it. This is a real
   coverage hole: a future change that genuinely drops the table read from this
   path would now go unflagged.

Both disappear under `predicate-builder-table-is-arel-table-not-tablemetadata`
(and/or `predicate-builder-type-lookup-cascade-is-invented`): once `table` IS a
TableMetadata, `build_bind_attribute` returns to a literal
`table.type(column_name)`, the cascade collapses to Rails' single source, the
`relation` parameter has no caller, and the gate can see the read inline again.

This story exists so the cleanup is _scheduled_ rather than trusted to memory.
The known failure mode is that a stale baseline entry keeps passing CI forever
and is later read as evidence the divergence was intended.

## Acceptance criteria

- [ ] Runs only AFTER `predicate-builder-table-is-arel-table-not-tablemetadata`
      (or whichever story collapses the cascade) has landed — verify the
      convergence is actually in `main` first; if the cascade still exists, this
      story is not yet actionable and should go back to draft.
- [ ] `buildBindAttribute` is back to the Rails-faithful `(columnName, value)`
      with no `relation` parameter, and no caller passes one.
- [ ] The `build_bind_attribute` -> `table` baseline entry is deleted from
      `call-mismatches-wide-exclude/.../predicate-builder.json`, and
      `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` passes
      with it gone (not merely re-baselined).
- [ ] The `build_bind_attribute` -> `type` entry is re-evaluated in the same
      pass and deleted if the convergence also satisfies it.
- [ ] The SQL-level guards added by #4963 in
      `relation/predicate-builder.trails.test.ts` ("collapses a joined
      out-of-range equality to 1=0" and its in-range control) still pass
      unchanged — the adaptation may go, the behaviour may not.
