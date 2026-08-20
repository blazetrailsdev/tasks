---
title: "define_attribute_methods omits load_schema because reflection drives generation"
status: claimed
updated: 2026-08-20
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-08-20T19:50:09Z"
assignee: "attribute-method-generation-driven-from-schema-reflection"
blocked-by: null
closed-reason: null
---

## Context

`define_attribute_methods` (`activerecord/lib/active_record/attribute_methods.rb:104-125`)
calls `load_schema` (`:114`) before `super(attribute_names)`. trails' port
(`packages/activerecord/src/attribute-methods.ts`) omits that call — the omission
is carried as a `call-mismatches-exclude` row (`activerecord/attribute-methods.json`,
`define_attribute_methods` → `load_schema`).

It is omitted because trails inverted the dependency. Rails' `load_schema!`
(`model_schema.rb:587-597`) generates no attribute methods at all; generation is
lazy, driven from `method_missing`/`respond_to?`. trails instead calls
`defineAttributeMethods()` from inside `applyColumnsHash`
(`packages/activerecord/src/model-schema.ts`), so schema reflection drives
generation. Adding Rails' `load_schema` call to `define_attribute_methods` closes
a cycle: generation → `attributeNames()` → `columnNames()` → `loadSchema` →
`applyColumnsHash` → generation.

PR #6779 contained that cycle with a `regeneratingAttributeMethods` WeakSet
guard in `model-schema.ts`, tagged `@noRailsEquivalent PERMANENT`. The tag is
accurate about the guard being un-portable, but the cycle it guards is trails'
own — so the guard is a symptom, not the fix.

## Converged shape

Generation stops being driven from schema reflection: `applyColumnsHash` no
longer calls `defineAttributeMethods` (matching `load_schema!`, which defines
nothing), and `define_attribute_methods` calls `loadSchema` where Rails calls it
(`:114`). With reflection no longer re-entering generation, the
`regeneratingAttributeMethods` WeakSet is deleted.

The open question this has to answer is what replaces the eager regeneration:
Rails regenerates lazily, so trails needs `method_missing` / the generated-module
lookup to be the trigger, or an explicit invalidation on the reflection paths
that currently rely on the eager call (`applyColumnsHash`,
`Attributes#defineAttribute` in `attributes.ts`).

## Acceptance criteria

- [ ] `applyColumnsHash` does not call `defineAttributeMethods`.
- [ ] `define_attribute_methods` calls `loadSchema`, mirroring attribute_methods.rb:114.
- [ ] `regeneratingAttributeMethods` (model-schema.ts) is deleted.
- [ ] The `define_attribute_methods` → `load_schema` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activerecord/attribute-methods.json`
      and the shard mark tightened with `pnpm parity:api:calls:tighten`.
