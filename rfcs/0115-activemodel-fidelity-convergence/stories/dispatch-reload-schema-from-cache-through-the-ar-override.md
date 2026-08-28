---
title: "Dispatch reload_schema_from_cache through the ActiveRecord::Attributes override"
status: draft
updated: 2026-08-28
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: ["activerecord"]
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

PR #7168 installed `ActiveRecord::Attributes::ClassMethods#reload_schema_from_cache`
(`vendor/rails/activerecord/lib/active_record/attributes.rb:268-271`) as
`reloadSchemaFromCache` in `packages/activerecord/src/attributes.ts:103-106` —
`resetDefaultAttributesBang()` then the `super` chain into
`packages/activerecord/src/model-schema.ts:773`.

It is reached only through `resetDefaultAttributes` (attributes.rb:293-295).
Every OTHER trails call site still reaches the ModelSchema half by static
import, bypassing the override:

- `packages/activerecord/src/model-schema.ts:811` (the `rescue` in `loadSchema`)
- `packages/activerecord/src/model-schema.ts:1260` (`ignoredColumns=`)
- `packages/activerecord/src/model-schema.ts:769` (`resetColumnInformation`)
- `packages/activerecord/src/model-schema.ts:789` (the descendant recursion)
- `packages/activerecord/src/locking/optimistic.ts:148`

In Ruby every one of those is `reload_schema_from_cache` sent to `self`, so on
an AR class they all dispatch to the Attributes override. trails compensates by
folding the `reset_default_attributes!` call INTO
`model-schema.ts`'s `reloadSchemaFromCache` (`:779-783`), which Rails does not
do — the bang lives only in the override.

## Converged shape

- The call sites above send `this.reloadSchemaFromCache()` (or the equivalent
  virtual dispatch trails uses for a protected class method) rather than
  importing `model-schema.ts`'s function directly, so an AR class routes
  through `attributes.ts`'s override.
- `model-schema.ts`'s `reloadSchemaFromCache` then drops its
  `resetDefaultAttributesBang()` call and its explanatory comment, mirroring
  `model_schema.rb:553-571` exactly.
- The descendant recursion (`:788-790`) likewise dispatches per subclass, so a
  descendant that is an AR class gets the override too — matching
  `descendant.send(:reload_schema_from_cache)`.

## Acceptance criteria

- [ ] `model-schema.ts`'s `reloadSchemaFromCache` body is line-for-line
      `model_schema.rb:553-571` with no `resetDefaultAttributesBang()` call.
- [ ] Every trails caller reaches it by dispatch, not by static import, so the
      `attributes.ts` override runs on AR classes.
- [ ] AR suites green on all three lanes; parity deltas non-negative.
