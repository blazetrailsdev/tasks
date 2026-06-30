---
title: "inspect-dispatch-overridable-attribute-for-inspect"
status: ready
updated: 2026-06-30
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while converging `core.test.ts` (RFC 0048 one-schema). Rails
`test_inspect_with_overridden_attribute_for_inspect`
(`activerecord/test/cases/core_test.rb:85-99`) overrides
`attribute_for_inspect` on a single instance and expects `full_inspect` /
`inspect` to honor it (title rendered upper-cased).

trails `inspectWithAttributes` (`packages/activerecord/src/core.ts:690-705`)
inlines `formatForInspect.call(this, name, this.readAttribute(name))` instead of
dispatching through the overridable `attributeForInspect` method (which exists
at `core.ts:88-92`). So a per-record `attributeForInspect` override is bypassed
and the inspect output is unaffected — diverging from Rails
`inspect_with_attributes` which calls `attribute_for_inspect(name)`.

## Acceptance criteria

- `inspectWithAttributes` calls `this.attributeForInspect(name)` (dynamic
  dispatch) so per-record / subclass overrides are honored, matching Rails.
- Un-skip `test_inspect_with_overridden_attribute_for_inspect` in `core.test.ts`.
