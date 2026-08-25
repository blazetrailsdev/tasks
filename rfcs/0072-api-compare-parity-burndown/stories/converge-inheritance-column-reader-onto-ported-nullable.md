---
title: "converge-inheritance-column-reader-onto-ported-nullable"
status: done
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5378
claim: "2026-07-27T00:06:54Z"
assignee: "converge-inheritance-column-reader-onto-ported-nullable"
blocked-by: null
closed-reason: null
---

## Context

Found while classifying `inheritance.ts` extra surface (#5342). trails has
**two** readers for Rails' `inheritance_column` class_attribute, and the
Rails-faithful one is already ported but bypassed:

- `ModelSchema.inheritanceColumn` (`model-schema.ts:1472`) — faithful. Returns
  `null` when STI is explicitly disabled (`self.inheritance_column = nil`,
  model_schema.rb:172 `class_attribute :inheritance_column, instance_accessor:
false, default: "type"`), else `_inheritanceColumn ?? "type"`. Exposed as the
  Rails-named `Base.inheritanceColumn` getter/setter at `base.ts:1649-1654`.
- `getInheritanceColumn` (`inheritance.ts:401`) — flattens `null` to `"type"`
  (`return this._inheritanceColumn ?? "type"` with no null arm), so a model
  with STI explicitly disabled still reports `"type"`.

Because of that flattening, trails needs a **second** predicate,
`inheritanceColumnDisabled` (`inheritance.ts:447`, `_inheritanceColumn === null`),
to recover the information the reader threw away. Rails has no such predicate —
callers test `inheritance_column` for nil directly.

`getInheritanceColumn` has 27 references (11 inside inheritance.ts); it is
currently carried as extra surface rather than converged.

## Acceptance criteria

- Route callers of `getInheritanceColumn` to the ported nullable reader
  (`Model.inheritanceColumn` / `ModelSchema.inheritanceColumn.call(klass)`),
  handling the `null` arm at each site instead of relying on the `"type"`
  flattening. Watch `base.ts:_instantiate` (`base.ts:2954-2960`), which today
  pairs `getInheritanceColumn` with `inheritanceColumnDisabled`.
- Delete `getInheritanceColumn`, and delete `inheritanceColumnDisabled` if the
  nullable reader makes it redundant (that is the expected outcome — it exists
  only to undo the flattening).
- Leave no `@noRailsEquivalent` tags behind (`scripts/api-compare/extra-surface.ts:44-47`) — the names are
  deleted, not tagged.
- parity:api and parity:test deltas non-negative; `pnpm parity:api:extra --package
activerecord` novel count for inheritance.ts stays 0.
- STI suites pass: inheritance.test.ts, inheritance-namespaced.test.ts,
  sti-attribute-routing.test.ts, modules.test.ts, plus any test that sets
  `inheritance_column = nil`.
