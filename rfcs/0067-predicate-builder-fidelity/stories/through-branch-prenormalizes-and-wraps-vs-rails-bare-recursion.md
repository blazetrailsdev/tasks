---
title: "Through-association branch pre-normalizes via AssociationQueryValue and And-wraps; Rails recurses bare and splices flat"
status: claimed
updated: 2026-07-23
rfc: "0067-predicate-builder-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-23T16:57:08Z"
assignee: "through-branch-prenormalizes-and-wraps-vs-rails-bare-recursion"
blocked-by: null
closed-reason: null
---

## Context

Rails' `expand_from_hash` through branch (vendor/rails/activerecord/lib/active_record/relation/predicate_builder.rb:110-113) is a bare recursion:

```ruby
next associated_table.predicate_builder.expand_from_hash(
  associated_table.primary_key => value
)
```

No value pre-normalization (the recursion's association/column arms handle records, arrays, relations), no wrapping — `next` inside `flat_map` splices the predicates flat, and composite `primary_key` flows into the array-key branch.

trails' `buildFromHashAssociation` through path (`packages/activerecord/src/relation/predicate-builder.ts` — the `isThroughAssociation?.()` arm, ~line 222-241 as of PR #5147) instead:

- throws on a composite primary key ("Slot B" error) rather than routing to the array-key/composite handling;
- pre-normalizes `value` through a synthetic `AssociationQueryValue({ joinForeignKey: pk, joinPrimaryKey: pk })` before recursing;
- wraps multi-predicate results in `new Nodes.And(inner)` instead of returning them flat (Rails' flat splice keeps each predicate addressable for `WhereClause#extract_attributes` / `rewhere`).

## Acceptance criteria

- [ ] Through branch is the bare Rails recursion: `assocPb.expandFromHash({ [primaryKey]: value })`, no AssociationQueryValue pre-normalization, predicates spliced flat (no And wrapper).
- [ ] Composite primary key routes like Rails (array-key branch / buildComposite equivalent) instead of throwing.
- [ ] test:compare / api:compare delta non-negative; no test renames.
