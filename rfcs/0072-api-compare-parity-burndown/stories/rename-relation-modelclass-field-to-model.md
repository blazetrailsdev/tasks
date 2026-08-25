---
title: "rename-relation-modelclass-field-to-model"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6121
claim: "2026-08-05T09:30:01Z"
assignee: "rename-relation-modelclass-field-to-model"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Relation` declares its readers in
`vendor/rails/activerecord/lib/active_record/relation.rb:71-73`:

```ruby
attr_reader :table, :model, :loaded, :predicate_builder
alias :klass :model
```

The backing ivar is `@model`. trails mirrors the public reader already
(`get model()` in `packages/activerecord/src/relation.ts`) and already names the
sibling field `_table` after `@table`, but the model field is spelled
`_modelClass` — the only one of the four that does not match its Rails ivar.

This is the same divergence class the `Relation#table` attr_reader campaign has
been closing (#5903, #5926, #5933). #5933 converged the last four
`this._modelClass.arelTable` reads onto `this.table`, which made the remaining
`_modelClass` spelling the conspicuous odd one out.

Scale: ~137 references across 20+ files. Most are inside `relation.ts` (52) and
the `relation/` subfiles (`calculations.ts`, `query-methods.ts`,
`finder-methods.ts`, `delegation.ts`, `spawn-methods.ts`,
`predicate-builder/polymorphic-array-value.ts`), but some are OUTSIDE the
relation tree — notably test-helper models reaching into the private field from
scope bodies:

- `packages/activerecord/src/test-helpers/models/post.ts:196,219,852,854`
- `packages/activerecord/src/test-helpers/models/author.ts`

Those are a second, separate divergence: Rails scope bodies use the PUBLIC
`klass` / `model` reader, never the ivar. They should be rewritten to the public
`model` getter rather than merely renamed.

This qualifies as the single-mechanical-rename exception to the no-fan-out rule,
so it can land as one PR despite being wide — but it conflicts with anything
else touching `relation.ts`, so it should be scheduled when no sibling relation
story is in flight.

## Acceptance criteria

- The private field `_modelClass` is renamed to `_model`, matching Rails'
  `@model` ivar, across all of `packages/activerecord/src`.
- The public `model` getter is unchanged; `klass` (if present) stays its alias,
  matching `alias :klass :model`.
- External readers of the private field in `test-helpers/models/**` are
  rewritten to the public `model` getter instead of the renamed private field,
  matching how Rails scope bodies reference `klass` / `model`.
- No behavior change: `pnpm typecheck` clean and the AR suite green; `parity:api`
  and `parity:test` deltas non-negative.
- PR body notes that this is the single-mechanical-rename exception to the
  no-fan-out rule.
