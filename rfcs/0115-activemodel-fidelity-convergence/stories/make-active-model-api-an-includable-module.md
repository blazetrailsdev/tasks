---
title: "Make ActiveModel::API an includable module, not a Model-only assembly"
status: ready
updated: 2026-08-26
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

`vendor/rails/activemodel/lib/active_model/api.rb:58-81` is a real
`ActiveSupport::Concern`: it `include`s `AttributeAssignment`, `Validations`
and `Conversion`, its `included do` block extends `Naming` and `Translation`,
and it defines `initialize(attributes = {})`. Any Ruby class becomes a model
with one line: `include ActiveModel::API` (`api.rb:14-17`).

trails' `packages/activemodel/src/api.ts` is not that. It exports an
`interface API { isPersisted(): boolean }` plus re-exports of Validations /
AttributeAssignment / ForbiddenAttributesProtection helpers — there is no
instance-method bundle to hand `include()`, and no `initialize`. The whole API
surface is hand-assembled onto `Model` by the ~30 `include()`/`extend()` calls
at the bottom of `packages/activemodel/src/model.ts:623-770`. A class that is
not `Model` therefore cannot be an ActiveModel API model in trails.

PR #7072 hit this porting `DirtyTest::DirtyModel`
(`vendor/rails/activemodel/test/cases/dirty_test.rb:6-43`), whose fixture is
`include ActiveModel::API; include ActiveModel::Dirty` on a plain class. The
port wires `Dirty` (and, for it, `AttributeMethods`, which Ruby gets from
`Dirty`'s own `include ActiveModel::AttributeMethods`, `dirty.rb:125`) but has
to leave the `API` include out entirely — see the fixture's doc comment in
`packages/activemodel/src/dirty.test.ts`. Nothing failed there only because
that fixture overrides `initialize` without `super` (`dirty_test.rb:11-17`) and
never touches `persisted?` / `Conversion` / `Naming`; the next port of a Rails
`include ActiveModel::API` class will not be so lucky.

## Converged shape

`api.ts` exports the module Ruby has, so `include(Klass, API)` /
`extend(Klass, APIClassMethods)` reproduces `api.rb:58-81` on any class:

- an instance bundle carrying `initialize` (`api.rb:78-81`) and the members
  `include AttributeAssignment` / `Validations` / `Conversion` contribute,
- an `[included]` hook doing `extend ActiveModel::Naming` +
  `extend ActiveModel::Translation` (`api.rb:65-68`), the same shape
  `Serializers::JSON`'s hook already uses (`serializers/json.ts`),
- `model.ts` then consumes that one module where it currently spells the
  includes out by hand, instead of both files owning half the list.

Related but distinct: `split-model-mixin-surface-to-active-model-model` moves
`Model`'s own surface into `model.rb`'s shape; this story is about `api.rb`
being includable at all.

## Acceptance criteria

- `include(SomeClass, API)` on a plain class gives it what
  `include ActiveModel::API` gives a Ruby class: the `initialize(attributes)`
  of `api.rb:78-81`, `persisted?`, and the AttributeAssignment / Validations /
  Conversion members, with `Naming` + `Translation` extended onto the class.
- `model.ts` reaches that surface through the module rather than re-listing it.
- `dirty.test.ts`'s `DirtyModel` wires `API` the way `dirty_test.rb:7` does,
  and its doc comment loses the paragraph explaining the gap.
- `pnpm parity:api --package activemodel` delta non-negative; no new
  `parity:api:extra` surface in `api.ts`.
