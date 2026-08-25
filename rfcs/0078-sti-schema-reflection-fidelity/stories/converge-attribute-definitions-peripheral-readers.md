---
title: "converge-attribute-definitions-peripheral-readers"
status: done
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6807
claim: "2026-08-21T10:40:22Z"
assignee: "converge-attribute-definitions-peripheral-readers"
blocked-by: null
closed-reason: null
---

## Context

Split 3/4 of `converge-attribute-definitions-onto-default-attributes` — the
peripheral ActiveRecord readers, ~40 non-test occurrences on `origin/main`
(measured 2026-08-18):

`persistence.ts` (6), `nested-attributes.ts` (5), `translation.ts` (3),
`insert-all.ts` (3), `fixtures.ts` (3), `enum.ts` (3), `type-caster/map.ts` (2),
`relation/calculations.ts` (2), `encryption.ts` (2),
`encryption/encryptable-record.ts` (8), `encryption/test-helpers.ts` (1),
`serialize.ts` (1), `associations/join-dependency.ts` (1).

Each should resolve through `attribute_types` / `_default_attributes` — the
Rails-shaped, per-class, replay-driven surface — instead of the invented map.
Rails anchor: `vendor/rails/activemodel/lib/active_model/attribute_registration.rb`,
`vendor/rails/activerecord/lib/active_record/model_schema.rb`.

## Acceptance criteria

- [ ] No `_attributeDefinitions` reader remains in **this slice's files** (the
      list above). The readers in `base.ts`, `attributes.ts`,
      `attribute-methods.ts` and `inheritance.ts` belong to slice 2,
      `converge-attribute-definitions-activerecord-core-readers`, and
      `model-schema.ts`'s machinery to slice 4 — this slice must not touch them,
      since slice 2 is worked in parallel on the same files.
- [ ] The one carve-out is `encryption/encryptable-record.ts`'s plain-object
      mock arm (`registerEncryptedType`, `getAttributeType`'s fallback):
      retiring it means migrating the mock models in five `encryption/` test
      files onto real `Base` subclasses, tracked separately as
      `retire-encryption-mock-model-immediate-path`.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] No regression in `persistence`, `nested-attributes`, `insert-all`,
      `fixtures`, `enum`, `calculations` and the `encryption/` suites.

## Dependencies

After slices 1 and 2.
