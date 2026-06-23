---
title: "am-attribute-method-pattern-accessors"
status: in-progress
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: activemodel
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4030
claim: "2026-06-23T19:12:29Z"
assignee: "am-attribute-method-pattern-accessors"
blocked-by: null
---

## Context

`ActiveModel::AttributeMethods` declares two `class_attribute`s
(`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:71-72`):
`attribute_aliases` and `attribute_method_patterns`, plus
`respond_to_without_attributes?` (the pre-attribute-methods `respond_to?` alias).
Because the module is included into Attributes and Dirty, the reader/writer/
predicate triple surfaces as a miss in three trails files:

- `packages/activemodel/src/attribute-methods.ts` (35/42, 7 miss):
  `attribute_aliases`, `attribute_aliases?`, `attribute_aliases=`,
  `attribute_method_patterns`, `attribute_method_patterns?`,
  `attribute_method_patterns=`, `respond_to_without_attributes?`.
- `packages/activemodel/src/attributes.ts` (12/17, 5 miss): same names minus the
  writers.
- `packages/activemodel/src/dirty.ts` (30/35, 5 miss): same five.

trails already implements attribute-alias resolution (`_attributeAliases`) and
method-pattern matching, but not under these Rails `class_attribute` names.
Triage: expose the named class-attribute accessors on the host, or skip-list
with a reason if the state is held under a different trails name and the public
accessor has no caller.

## Acceptance criteria

- `attribute_aliases`/`attribute_method_patterns` (reader + `=` writer + `?`
  predicate) and `respond_to_without_attributes?` resolved on
  attribute-methods.ts (and inherited into attributes.ts/dirty.ts) — ported to
  the existing trails state, or `SKIP_GROUPS` entries with reason.
- A test asserting the accessor reflects declared aliases/patterns where ported
  (match Rails test name).
- `pnpm api:compare --package activemodel` shows attribute-methods.ts,
  attributes.ts, dirty.ts at 100%.
