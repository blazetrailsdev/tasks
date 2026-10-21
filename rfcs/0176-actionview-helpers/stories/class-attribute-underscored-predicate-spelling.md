---
title: "class-attribute-underscored-predicate-spelling"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
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

# classAttribute predicate spelling for underscored attributes: `is_x` to `_isX`

## Context

A Ruby private predicate `_include_layout?` (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:430`) is ported `_isIncludeLayout`, but `rubyMethodToTs` used to produce `is_includeLayout`. `actionview-api-residue-context-buffers-layouts-template` made `scripts/parity/conventions.ts` offer `_isX` first, and kept `is_x` as a fallback candidate (`generatedIsPrefixed`) because `classAttribute` (`packages/activesupport/src/class-attribute.ts:115`) still generates `is${upperFirst(name)}` — `is_reflections`, `is_attrReadonly`, `is_wrapperOptions`, `is_routes`, `is_validators`, `is_actions` — and `autosave-association.ts` has `is_recordChanged`, `core-ext/range/overlap.ts` `is_emptyRange` (~85 sites across packages, incl. tests).

## Acceptance criteria

- `classAttribute` generates `_isX` for an underscored attribute; every `is_x` declaration and reader is renamed.
- The `generatedIsPrefixed` fallback is removed from `rubyMethodToTs`, and the conventions doc regenerated.
- `pnpm parity:api:predicates` and `parity:api:extra:gate` stay green.
