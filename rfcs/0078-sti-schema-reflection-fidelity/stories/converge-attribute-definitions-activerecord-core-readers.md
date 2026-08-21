---
title: "converge-attribute-definitions-activerecord-core-readers"
status: claimed
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T03:40:24Z"
assignee: "converge-attribute-definitions-activerecord-core-readers"
blocked-by: null
closed-reason: null
---

## Context

Split 2/4 of `converge-attribute-definitions-onto-default-attributes` (see that
story for the Rails anchor: `_default_attributes` / `attribute_types` in
`vendor/rails/activemodel/lib/active_model/attribute_registration.rb` and
`vendor/rails/activerecord/lib/active_record/model_schema.rb`).

This slice is the **ActiveRecord core** readers — the largest cluster, 34
non-test occurrences on `origin/main` (measured 2026-08-18):

- `packages/activerecord/src/base.ts:1215-1219`, `:1235`, `:1275`, `:1287`,
  `:1373`, `:1430`, `:1444` (the `hasOwnProperty` walk up to the defining
  class), `:1460`, `:1485`, `:2895`, `:4328`
- `packages/activerecord/src/attributes.ts:88-95` (copy-on-write declare),
  `:141-191` (the schema-cache reflection into the map)
- `packages/activerecord/src/attribute-methods.ts:190`, `:413`, `:496`, `:576`,
  `:670`, `:715`, `:722`
- `packages/activerecord/src/inheritance.ts:431`, `:831`

Classify each as "could read `attribute_types`" (most of the `.has(name)` /
`.keys()` readers) vs "genuinely needs schema column metadata" (which should go
to `columnsHash`, not to a parallel map).

## Acceptance criteria

- [ ] Every `_attributeDefinitions` reader in `base.ts`, `attributes.ts`,
      `attribute-methods.ts` and `inheritance.ts` resolves through
      `_default_attributes` / `attribute_types` (or `columnsHash` where the
      reader genuinely wants column metadata).
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] No regression in `inheritance`, `attributes`, `model-schema`, `dirty`,
      `sti/` and `attribute-methods` suites.

## Dependencies

Best after the ActiveModel slice lands (`_default_attributes` is the surface
this slice reads through).
