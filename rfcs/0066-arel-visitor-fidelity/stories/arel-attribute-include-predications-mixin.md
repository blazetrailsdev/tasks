---
title: "arel-attribute-include-predications-mixin"
status: done
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5019
claim: "2026-07-20T23:06:44Z"
assignee: "arel-attribute-include-predications-mixin"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Arel::Attributes::Attribute`
(`vendor/rails/activerecord/lib/arel/attributes/attribute.rb:5-12`) is a
`Struct` that `include Arel::Predications` and defines **no** predication
methods of its own — `in`, `not_in`, `eq`, `matches`, `between` etc. all come
from the mixin, dispatching through `self` for `quoted_node` / `quoted_array`.

Trails' `packages/arel/src/attributes/attribute.ts:104` instead **re-declares**
each predication method on the class. It imports `Predications` only to
`.call` a few private helpers (`groupingAny` / `groupingAll`, attribute.ts:335, 347) — there is no `include(Predications)` anywhere in the file (grep for
`include(` returns 0 hits).

Surfaced reviewing PR 5005, which converged `Predications#in`/`#notIn` with
Rails and shared the `isSelectManagerLike` / `isEnumerable` guards. Post-PR 5005
`Attribute#in`/`#notIn` (attribute.ts:198-209) are byte-identical to the mixin
versions — pure duplication. The reviewer proposed simply deleting the two
overrides, but that is NOT safe today: with no `include`, deleting them deletes
the methods outright rather than falling through to the mixin.

The real convergence is to make `Attribute` actually include the mixin, via
`include()` / `Included<>` from `@blazetrailsdev/activesupport` (the documented
pattern in CLAUDE.md, already used by `relation.ts` + `relation/query-methods.ts`).
That is a whole-class change touching every predication method, well beyond
PR 5005's scope — hence a separate story.

## Acceptance criteria

- [ ] `Attribute` obtains its predication methods by including the
      `Predications` mixin rather than re-declaring them, mirroring
      `attribute.rb:5-12`.
- [ ] `quotedNode` / `quotedArray` stay on `Attribute` (it supplies the
      type-casting versions); `this`-dispatch from the mixin must resolve to
      them. NB: class FIELDS are invisible to `Object.create(proto)` test
      hosts — prefer prototype methods over `override x = fn`.
- [ ] Duplicated method bodies in `attribute.ts` are deleted, not left
      shadowing the mixin.
- [ ] The `Attribute`-specific tests in `attribute.test.ts` /
      `attribute.trails.test.ts` still pass unchanged.
- [ ] api:compare / test:compare delta non-negative; check the wide call
      ratchet for entries that go stale when these bodies are deleted.
