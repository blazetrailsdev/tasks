---
title: "converge-primary-key-id-writer-onto-accessor"
status: done
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5413
claim: "2026-07-27T15:01:14Z"
assignee: "converge-primary-key-id-writer-onto-accessor"
blocked-by: null
closed-reason: null
---

## Context

From the `audit-set-prefixed-writers-for-accessor-convergence` inventory.
`scripts/api-compare/conventions.ts` maps a Ruby writer `foo=` onto the SAME
camelCase name as its reader, so an `export function setFoo` sibling is TS
surface Rails does not have.

`packages/activerecord/src/attribute-methods/primary-key.ts:126` exports
`setId`, the writer half of Rails'
`ActiveRecord::AttributeMethods::PrimaryKey#id=` in
`vendor/rails/activerecord/lib/active_record/attribute_methods/primary_key.rb`.
The reader `id` is in the same TS file (line ~100), so the pair is a genuine
accessor that TypeScript can only spell as `get id()` / `set id()`.

This one is separated from the other ActiveRecord writers because `id` is an
instance-level attribute accessor on every model: it interacts with the
generated attribute-method dispatch, the composite-primary-key `[nil]` id
shape, and `Base`'s own `id` handling, so the convergence needs its own
review pass rather than riding along with the class-level writers.

The converged shape is an exported class module holding the `get`/`set` pair
under the Rails name, mixed into `Base.prototype` via `include()` from
`@blazetrails/activesupport` (which copies accessor descriptors intact).
Exemplar: `packages/actionpack/src/action-dispatch/http/mime-negotiation.ts`.

## Acceptance criteria

- `setId` no longer exists as a `set`-prefixed export; the writer lives as
  `set id()` under the Rails name.
- Composite-primary-key and attribute-method dispatch behaviour unchanged.
- No new extra-surface allowlist entries or `@noRailsEquivalent` tags.
- Touched activerecord test files stay green.
