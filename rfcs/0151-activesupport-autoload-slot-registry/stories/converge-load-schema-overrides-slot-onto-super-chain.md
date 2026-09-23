---
title: "converge-load-schema-overrides-slot-onto-super-chain"
status: draft
updated: 2026-09-23
rfc: "0151-activesupport-autoload-slot-registry"
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

## Context

Split out of `converge-activerecord-core-slots-onto-autoload`: `packages/activerecord/src/load-schema-overrides-slot.ts`
is not a constant slot, so it has no `autoload` target. It is a registry emulating a `super` chain:

- `counter-cache.ts:216` — `registerLoadSchemaOverride(309, loadSchemaBang)`, the port of
  `CounterCache::ClassMethods#load_schema!` (`activerecord/lib/active_record/counter_cache.rb:186-199`, `super` first).
- `encryption/encryptable-record.ts:337` — `registerLoadSchemaOverride(313, EncryptableRecord.loadSchemaBang)`, the port of
  `EncryptableRecord#load_schema!` (`encryption/encryptable_record.rb:126-130`, `super` first).
- `model-schema.ts:517` walks `loadSchemaOverrides` in "include order" around `ModelSchema#load_schema!` (`model_schema.rb:587`).

The `includeOrder` numbers are invented; Ruby gets the order from the ancestor chain.

## Acceptance criteria

- The two overrides reach `ModelSchema#load_schema!` through `super` on the class they are mixed into
  (`extend()` / `Extended<>` from `@blazetrails/activesupport`, CLAUDE.md § "Module mixins"), in Rails' ancestor order.
- `load-schema-overrides-slot.ts`, its `.trails.test.ts` and the `@noRailsEquivalent PERMANENT` receipts are deleted.
- A plain-node import of the built `dist/counter-cache.js`, `dist/encryption/encryptable-record.js` and `dist/model-schema.js` as entry modules does not throw TDZ.
