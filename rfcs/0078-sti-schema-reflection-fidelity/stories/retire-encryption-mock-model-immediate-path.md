---
title: "retire-encryption-mock-model-immediate-path"
status: ready
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
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

`EncryptableRecord.registerEncryptedType` (`packages/activerecord/src/encryption/encryptable-record.ts`)
is the "immediate path" `encryptAttribute` takes for plain-object callers that
have no `decorateAttributes` — it writes an `EncryptedAttributeType` straight
into the trails-invented `_attributeDefinitions` map, and `getAttributeType`
falls back to reading it. Rails has no such branch: `encrypts` always goes
through `decorate_attributes`
(`vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb:87-92`).

It is the last `_attributeDefinitions` reader/writer left outside
`model-schema.ts` / `base.ts` / `attributes.ts` after
`converge-attribute-definitions-peripheral-readers` (PR converging the
peripheral readers), which deliberately left it: retiring the branch means
moving its callers — the plain-object mock models in
`encryption/configurable.test.ts`, `encryption/encryption-schemes.test.ts`,
`encryption/extended-deterministic-queries.test.ts`,
`encryption/extended-deterministic-uniqueness-validator.test.ts` and
`encryption/encryptable-record.test.ts` — onto real `Base` subclasses backed by
the canonical schema, which is a test migration in its own right. Several of
those tests assert on `modelClass._attributeDefinitions.get("name").type`
directly.

## Acceptance criteria

- [ ] `registerEncryptedType` and the `getAttributeType` `_attributeDefinitions`
      fallback are deleted; `encryptAttribute` has one path
      (`decorate_attributes`), as in Rails.
- [ ] The mock-model encryption tests run against real `Base` subclasses and
      resolve types through `typeForAttribute`; no test asserts on
      `_attributeDefinitions`.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] The `encryption/` suites pass.
