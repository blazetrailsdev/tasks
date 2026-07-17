---
title: "Declared attribute() with no default seeds an initialized slot where Rails leaves it uninitialized"
status: draft
updated: 2026-07-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #4909 (converge ignored-column attribute-set semantics).

Rails leaves a declared attribute's default slot UNINITIALIZED when no explicit
default is given: `_default_attributes` holds `Attribute.uninitialized`, so on a
`new` record (and after a narrowed load) `@attributes.key?(name)` is false until
a value is assigned or loaded (activemodel attribute_set/builder.rb;
model_schema.rb `columns_hash.except(*ignored_columns)` only strips schema
types, not user `attribute()` declarations).

trails instead seeds a declared `attribute()` as an INITIALIZED default. This
surfaced for a declared-then-ignored column (Rails' `AttributedDeveloper#name`):
after a narrowed reload the seeded initialized default kept the slot in
`_attributes.keys()`, which would wrongly install a dynamic accessor. PR #4909
worked around it narrowly in `narrowToProjectedColumns`
(`packages/activerecord/src/inheritance.ts`, ~line 590) by uninitializing any
ignored column the row did not carry.

The root divergence — trails seeding declared-attribute defaults as initialized
where Rails leaves them uninitialized — is latent and may surface beyond the
ignored-column case (dirty tracking against defaults, `attributes` hash / `key?`
on a `new` record with a bare `attribute :x, :string` and no default). Audit
whether trails' initialized-default seeding for declared attributes matches
Rails' uninitialized slots, and if it diverges, converge it so the
`narrowToProjectedColumns` ignored-column workaround becomes unnecessary.

## Acceptance criteria

- Determine (with Rails source + a probe) whether a bare `attribute("x","string")`
  with no default yields an uninitialized slot in Rails but an initialized one in
  trails, on both a `new` record and after a narrowed load.
- If it diverges: converge trails to leave such slots uninitialized, and remove
  the ignored-column narrowing workaround in `narrowToProjectedColumns` if it is
  then redundant.
- If it does NOT diverge (the ignored case is genuinely special), document why
  and close as no-op.
