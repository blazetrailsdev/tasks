---
title: "assertNestedAttributesAreKnown is an invented pre-flight guard Rails raises from the assignment instead"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 18
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assertNestedAttributesAreKnown` (`packages/activerecord/src/nested-attributes.ts`,
3 call sites) is an invented pre-flight guard. It walks the assignable keys,
probes `attributeTypes()` and a throwaway `new targetModel()`, and raises
`UnknownAttributeError` before any assignment happens.

Rails has no such pass. `assign_nested_attributes_for_one_to_one_association`
(`activerecord/lib/active_record/nested_attributes.rb:423-457`) and
`..._for_collection_association` (`:487-547`) hand the attributes straight to
`assign_to_or_mark_for_destruction` (`:626-629` → `record.assign_attributes`)
or to `association.reader.build` — and the `UnknownAttributeError` surfaces
from `ActiveModel::AttributeAssignment#_assign_attributes`
(`activemodel/lib/active_model/attribute_assignment.rb:36-48`) at the
assignment itself, per-key, in key order.

The divergence is observable: trails raises before ANY key of ANY record in
the collection is assigned, where Rails raises partway through, having already
assigned the earlier records and the earlier keys of the failing one. It also
costs a model instantiation and a `attributeTypes()` read per assignment, and
it is silently skipped whenever `attributeTypes()` is empty — a guard that
does not fire is a guard that was not needed.

## Converged shape

Delete `assertNestedAttributesAreKnown` and all three call sites; let
`setAttributes` / `build` raise `UnknownAttributeError` where Rails does.
Establish first that trails' `assignAttributes`/`setAttributes` path actually
raises for an unknown key on a built-but-unsaved record — if it does not, the
fix belongs there, not in a pre-pass inside nested-attributes.

## Acceptance criteria

- [ ] `git grep assertNestedAttributesAreKnown -- packages/` returns nothing.
- [ ] An unknown nested attribute still raises `UnknownAttributeError`, from
      the assignment site.
- [ ] `should rollback any changes if an exception occurred while saving`
      (`autosave-association.test.ts`) still passes, with the raise arriving
      from whichever call Rails raises from.
- [ ] `nested-attributes*.test.ts` green on all three lanes.
