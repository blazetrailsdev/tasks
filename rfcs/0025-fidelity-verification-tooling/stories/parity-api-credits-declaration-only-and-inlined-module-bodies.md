---
title: "parity-api-credits-declaration-only-and-inlined-module-bodies"
status: draft
updated: 2026-08-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api` matches a Ruby method to a TS member by name, and a TS name is
credited wherever it is declared. Two consequences surfaced by the 2026-08-28
arel re-audit:

1. **A body-less declaration scores as a port.**
   `vendor/rails/activerecord/lib/arel/crud.rb:6-47` is a module with four
   bodies (`compile_insert`, `create_insert`, `compile_update`,
   `compile_delete`). `packages/arel/src/crud.ts:10-24` is a bare
   `interface Crud` with the four signatures. `parity:api --package arel`
   reports `crud.rb → crud.ts 4/4 100%`. A Rails developer opening the
   two files side by side finds nothing to compare.

2. **A body in the wrong file scores as a port of the right one.** The four
   bodies actually live on `SelectManager` at
   `packages/arel/src/select-manager.ts:295-338`. Rails puts them in
   `crud.rb` and `include Crud`s them (`select_manager.rb:6`). The
   extra-surface report has a "moved" bucket for a TS name whose Ruby twin is
   in a *different* `.rb`; there is no mirror bucket for a Ruby member whose TS
   body is in a different `.ts` than the Rails file's twin, so decomposition
   drift of this shape (module bodies inlined onto the including class) is
   invisible. The first arel audit's biggest finding — `Attribute`
   hand-copying four mixins (fixed in #7123) — was the same class of drift and
   was also found by hand.

The extractor already knows (a) whether a TS member is a declaration in an
`interface`/`type` vs a method/function with a body, and (b) from the Ruby
side, which module a class `include`s (it resolves `include` for the
inheritance column).

## Acceptance criteria

- `parity:api` credits a Ruby method only against a TS member that has a
  body: a class method/accessor/field initializer, a top-level function, or a
  property assigned a function. A match whose only TS declaration is in an
  `interface` or `type` is reported in a new `declaration-only` column per
  file and counted as a miss in the percentage.
- For each Ruby module that a Ruby class `include`s, `parity:api` reports a
  module member whose TS body is defined on the including class's file (not the
  module's twin file) as `inlined-from <module>.rb` — a new bucket beside
  `moved` in `parity:api:extra`, report-only until seeded, then only-shrink
  like the existing marks.
- Unit tests over a fixture pair: an interface-only twin scores 0/N with the
  `declaration-only` column populated; a body on the including class scores
  `inlined-from`; the settled mixin shapes (`this`-typed functions +
  `include()`, `Included<>` interfaces) still score as matched with no new
  bucket.
- On landing, `crud.ts` shows 0/4 + 4 declaration-only, and
  `select-manager.ts` shows 4 `inlined-from crud.rb`; the arel gate is not
  raised to absorb it — `arel-crud-interface-holds-no-bodies` (RFC 0124)
  converges the code.
