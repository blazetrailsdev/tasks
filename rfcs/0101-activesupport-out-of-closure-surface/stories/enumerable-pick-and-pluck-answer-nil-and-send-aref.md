---
title: "activesupport: Enumerable#pick answers nil for an empty collection, and pick / pluck send []"
status: draft
updated: 2026-10-04
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8494. Rails' `Enumerable#pick`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:182-192`) opens with
`return if none?`, so an empty collection answers `nil`. Its `pluck` (`:163-170`) and `pick` both
read `element[key]`, the `[]` send.

`packages/activesupport/src/enumerable-utils.ts`:

- `pick` answers `undefined` for an empty collection (`enumerable-extended.test.ts:313` asserts
  `toBeUndefined()`, where Rails' test is `assert_nil`). `Relation#pick`
  (`packages/activerecord/src/relation/calculations.ts`) therefore appends `?? null` to
  `records.pick(*column_names)` (`activerecord/lib/active_record/relation/calculations.rb:354`), a
  short-circuit Rails does not have.
- `pluck` and `pick` read the JS property `element[key]`. On a composite-primary-key record the
  `id` property is the composite, not the `id` column Ruby's `record[:id]` reads, so
  `batchOnUnloadedRelation` cannot use `pluck` (tracked from the caller's side by
  `activerecord-converge-invented-control-flow-arms-relation-part-1-residue`).

## Acceptance criteria

- [ ] `pick` answers `null` for an empty collection, its test asserts `toBeNull()`, and `Relation#pick` drops `?? null`.
- [ ] `pluck` and `pick` dispatch Ruby's `[]` send on each element (a Hash key read, a record's `read_attribute`), with a test over a composite-primary-key record's `id`.
- [ ] `enumerable-extended.test.ts`, `calculations.test.ts` and `batches.test.ts` green.
