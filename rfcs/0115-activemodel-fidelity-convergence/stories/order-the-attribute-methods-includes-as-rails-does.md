---
title: "Include the attribute-methods submodules in attribute_methods.rb's order — PrimaryKey before Dirty"
status: draft
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the reviewer on PR #7122, which converged the BeforeTypeCast half
of this ordering but left the rest. Predates that PR (confirmed against
`git show origin/main`), so it is inherited debt, not new.

`ActiveRecord::AttributeMethods`' `included do` block fixes the order the
attribute-method submodules enter a model's ancestry:

`activerecord/lib/active_record/attribute_methods.rb:11-20`

```ruby
included do
  initialize_generated_modules
  include Read
  include Write
  include BeforeTypeCast
  include Query
  include PrimaryKey
  include TimeZoneConversion
  include Dirty
  include Serialization
end
```

`packages/activerecord/src/base.ts:4625-4643` runs a different order:

```ts
include(Base, _BeforeTypeCast); // 4625
include(Base, AMDirty); // 4634 — ActiveModel::Dirty, via AR Dirty
include(Base, _Dirty); // 4637 — AR AttributeMethods::Dirty
include(Base, _PrimaryKey); // 4638
include(Base, _CompositePrimaryKey); // 4643
```

PrimaryKey lands AFTER Dirty where Rails puts it before. Ruby's later-include-
wins is exactly what trails' `include()` implements (include.ts:120-152's
`includedKeys` registry), so the two orders are not equivalent: a name defined
by both modules resolves to Dirty's here and to PrimaryKey's in Rails. `id`,
`id=`, `id_was`, `id_in_database` and the rest of PrimaryKey's
`ID_ATTRIBUTE_METHODS` (primary_key.rb) are the surface where that can bite.

The order also has no Read / Write / Query / TimeZoneConversion `include()`
calls at all — those modules' members reach `Base` by other routes (the
prototype object literal near base.ts:4750, `declare` lines, `extend()`), so
this story is about the ordered spine, not about relocating every member.

## Converged shape

Make the attribute-methods includes in `base.ts`'s wiring block read in
attribute_methods.rb:12-19's order, with PrimaryKey ahead of Dirty. Where a
submodule has no `include()` call today, either give it one (if it has a real
module object to include) or leave a single ordered comment marking its Rails
seat — do not invent an empty module to fill the slot.

Watch two things while moving `_PrimaryKey`:

- `_CompositePrimaryKey` is included immediately after `_PrimaryKey` and must
  stay above it (base.ts:4639-4643 explains why); move the pair together.
- The prototype object literal further down deliberately omits
  `primaryKeyValuesPresent` and the ID_ATTRIBUTE_METHODS readers because they
  are accessor properties (base.ts:4761-4765). Re-check that comment still
  describes reality after the move.

## Acceptance criteria

- The attribute-methods `include(Base, …)` calls appear in
  attribute_methods.rb:12-19's order; PrimaryKey (and CompositePrimaryKey)
  precede `AMDirty` / `_Dirty`.
- No submodule loses a member, and no empty placeholder module is introduced
  to fill a Rails slot trails wires another way.
- activerecord suite green — `primary-key.test.ts`, `dirty.test.ts`,
  `composite-primary-key*.test.ts` and `attribute-methods.test.ts` especially.
- `pnpm parity:api:calls` / `:args` clean; `pnpm parity:api:extra:gate` marks
  narrow, never rise; parity deltas non-negative.
