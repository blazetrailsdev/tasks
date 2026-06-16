---
title: "cc-id-setter-missing-attribute"
status: in-progress
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3428
claim: "2026-06-16T00:36:52Z"
assignee: "cc-id-setter-missing-attribute"
blocked-by: null
---

## Context

Surfaced while un-skipping `primary_keys_test.rb` residuals in RFC 0030 story
`c3-primary-keys` (`packages/activerecord/src/primary-keys.test.ts`, test
`assign id raises error if primary key doesnt exist`).

Rails: an anonymous class on a table with no primary key (`dashboards`,
`primaryKey: false`) raises `ActiveModel::MissingAttributeError` on
`instance.id = "1"`. In TS, the class `primaryKey` correctly resolves to `null`
(via the warmed schema cache), but the instance `id=` setter
(`setId` in `packages/activerecord/src/attribute-methods/primary-key.ts`)
silently writes through `_writeAttribute` with a null/absent column instead of
raising. The write is a no-op rather than an error.

## Acceptance criteria

- [ ] `instance.id = value` raises the MissingAttributeError equivalent when
      the model's primary key resolves to null (no PK column on the table),
      matching Rails `AttributeMethods::PrimaryKey#id=`.
- [ ] Un-skip `assign id raises error if primary key doesnt exist` in
      `primary-keys.test.ts` and confirm it passes.
