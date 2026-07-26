---
title: "Make SingularAssociation#findTarget a real instance method"
status: draft
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5360 (story `extra-surface-relocate-load-belongs-to`) moved the belongs_to
target load out of the `associations.ts` engine into its Rails-layout file and
renamed it to `findTarget`:

- `packages/activerecord/src/associations/singular-association.ts`
  (Rails `ActiveRecord::Associations::SingularAssociation#find_target`,
  `vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:47`)

That cleared the `api:compare` extra (`associations.ts` 14 → 13 novel), but the
same fidelity gap called out by the sibling story
`through-find-target-becomes-instance-method` remains, in a different file: in
Rails `find_target` is a **private instance method** on the association object,
reading `owner` / `reflection` / `scope` off `self`. In trails it is still a
module-level function with the engine signature
`(record: Base, assocName: string, options: AssociationOptions)`.

The sibling story is scoped explicitly to the two through files
(`has-many-through-association.ts`, `has-one-through-association.ts`) and does
not cover `singular-association.ts`, so this half would otherwise be orphaned.

Current callers of the free function:

- `associations.ts` — three through-loader call sites
- `associations/belongs-to-association.ts:~323` — inside
  `BelongsToAssociation`, which already has `this.owner` / `this.reflection`
  and is the natural host
- `associations/instance-methods.ts` — the `record.loadBelongsTo(name)` reader
  sugar
- `delegate.ts`, `test-helpers/models/bulb.ts`, and several test files

Note the callers pass arbitrary `(name, options)` pairs — including for
associations with no registered reflection (the inline fallback arm inside
`findTarget` exists for exactly that) — so converting to an instance method
requires either materialising an Association for those paths or keeping a thin
functional entry point. That shape decision is the substance of this story and
should match whatever `through-find-target-becomes-instance-method` settles on;
sequence this after it so both land on one pattern.

## Acceptance criteria

- `findTarget` in `associations/singular-association.ts` is a method on
  `SingularAssociation` (or `BelongsToAssociation`, matching Rails' host),
  reading `owner` / `reflection` / `scope` off `this`.
- `api:compare` still matches `singular_association.rb` 10/10 and
  `associations.ts` novel extras do not increase.
- The `record.loadBelongsTo(name)` reader sugar keeps working unchanged.
- Association suites pass; no test renames.
- Follows the pattern chosen by `through-find-target-becomes-instance-method`.
