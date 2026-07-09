---
title: "Memoize attribute_types record + fallback Proxy instead of rebuilding per call"
status: ready
updated: 2026-07-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails memoizes `attribute_types`:
`@attribute_types ||= _default_attributes.cast_types.tap { |h| h.default = Type.default_value }`
(`activemodel/lib/active_model/attribute_registration.rb:43-50`), invalidating
the memo through the same `reset_default_attributes` cascade that clears
`_default_attributes`.

trails' `attributeTypes()`
(`packages/activemodel/src/attribute-registration.ts:222-237`) rebuilds the
whole cast-types record via `_defaultAttributes().castTypes()` AND wraps it in a
brand-new fallback `Proxy` on every single call. `_defaultAttributes()` itself
is cached, but `castTypes()` re-iterates the full attribute set and the Proxy is
re-allocated each time.

Surfaced by `converge-type-for-attribute-through-attribute-types` (PR #4812):
the per-predicate-bind hot path was moved off `attributeTypes()` onto an O(1)
`_defaultAttributes().getAttribute(name).type` read specifically to dodge this
cost, but every other caller of `attributeTypes()` and the generic
`typeForAttribute()` (which does `attributeTypes()[resolved]`) still rebuilds
the record + Proxy each call.

## Acceptance criteria

- Memoize the built `attribute_types` record (+ its fallback Proxy) on the class,
  mirroring Rails' `@attribute_types ||=`.
- Invalidate the memo wherever `_default_attributes` is reset
  (`resetDefaultAttributes` / `resetDefaultAttributesBang` cascade) so a schema
  reload or new attribute declaration rebuilds it — no staleness.
- Own-property guarded per class so a subclass never reads/writes a parent's memo.
- Existing attribute-registration / attributes / type_for_attribute suites stay green.
