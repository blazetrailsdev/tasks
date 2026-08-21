---
title: "converge-attribute-definitions-core-readers"
status: in-progress
updated: 2026-08-21
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6806
claim: "2026-08-21T09:40:24Z"
assignee: "converge-attribute-definitions-core-readers"
blocked-by: null
closed-reason: null
---

## Context

`converge-attribute-definitions-onto-default-attributes` shipped its first
tranche in the PR that closes this epic's parent story: the _leaf_ readers of
the invented `_attributeDefinitions` map converged onto Rails' `attribute_types`
/ `_default_attributes` surface —

- `activerecord/src/translation.ts` `lookupAncestors` now walks to `base_class?`
  (`vendor/rails/activerecord/lib/active_record/translation.rb:6-15`) instead of
  probing for `"_attributeDefinitions" in parent`.
- `activerecord/src/insert-all.ts` dropped the invented `_physicalTimestampCols`
  / `updateTimestampColumnsInModel` / `TIMESTAMP_COLUMNS` machinery for
  `all_timestamp_attributes_in_model` and `timestamp_attributes_for_update_in_model`
  (`insert_all.rb:94, 222, 282`), and `values_list` resolves its cast type through
  `model.type_for_attribute(key)` (`insert_all.rb:312`).
- `activerecord/src/relation/calculations.ts` `pluckCastTypeForKnownColumn`
  keys off `attribute_types` (`calculations.rb:617`).

What remains are the _core_ readers, where the map is still the eagerly
maintained sidecar the story describes. Re-verified 2026-08-20 on the branch,
non-test reference counts:

```text
27 activerecord/src/model-schema.ts        13 activerecord/src/base.ts
 9 activerecord/src/attributes.ts           9 activemodel/src/attribute-registration.ts
 8 activerecord/src/encryption/encryptable-record.ts
 8 activerecord/src/attribute-methods.ts    6 activerecord/src/persistence.ts
 6 activemodel/src/model.ts                 5 activerecord/src/nested-attributes.ts
 5 activemodel/src/attributes.ts            4 activerecord/src/inheritance.ts
 4 activemodel/src/attribute-methods.ts     3 activerecord/src/insert-all.ts
 3 activerecord/src/fixtures.ts             3 activerecord/src/enum.ts
 2 activerecord/src/encryption.ts           2 activemodel/src/serialization.ts
 2 activemodel/src/secure-password.ts       1 activerecord/src/serialize.ts
 1 activerecord/src/associations/join-dependency.ts
 1 activerecord/src/encryption/test-helpers.ts
```

Two readers were deliberately left for a later tranche because converging them
naively forces a `_default_attributes` materialization at _declaration_ time,
which drags `loadSchema` in before an adapter is configured:

- `activemodel/src/secure-password.ts:43,50` — the `has_secure_password`
  `attribute(...)` pre-declarations (themselves a trails invention; Rails
  `secure_password.rb:116-146` declares nothing) guard on
  `_attributeDefinitions.has`.
- `activerecord/src/enum.ts:159` — reads `def.source` / `def.userProvided`, a
  provenance field `_default_attributes` has no counterpart for.

## Scope

Everything in the parent story's acceptance criteria that the first tranche did
not reach:

1. Route the core readers (`model-schema.ts`, `base.ts`, `attributes.ts`,
   `attribute-methods.ts`, `persistence.ts`, `inheritance.ts`,
   `nested-attributes.ts`, `encryption/*`) through `_default_attributes` /
   `attribute_types`.
2. Delete `_schemaRevision`, `schemaStaleAgainstAncestors` and `ownSchemaMemo`
   (`model-schema.ts:47-112`, `:279-291`, `:986`, `:1253`), replacing them with
   Rails' direct class+descendant invalidation (`model_schema.rb:523`, `:553`).
3. Delete `scrubSchemaSourcedDefinitions` (`model-schema.ts:967-977`).
4. Delete `replayOwnPendingDecorators`
   (`activemodel/src/attribute-registration.ts`, sole call site
   `model-schema.ts:1248`), leaving `PendingDecorator#applyTo` as the single
   replay path.
5. Resolve the two deferred readers above, including whether the
   `has_secure_password` pre-declarations can go away entirely.

This is still larger than one PR — split it by reader cluster (schema/columns,
attribute methods, encryption, enum/provenance) as the inventory dictates.

## Acceptance criteria

- [ ] `_attributeDefinitions` has no readers outside its own definition, then is
      deleted.
- [ ] `_schemaRevision`, `schemaStaleAgainstAncestors`, `ownSchemaMemo`,
      `scrubSchemaSourcedDefinitions` and `replayOwnPendingDecorators` are gone.
- [ ] The STI guards in `normalized-attribute.trails.test.ts` still pass.
- [ ] No regression in `inheritance`, `attributes`, `model-schema`, `enum`,
      `dirty`, `sti/`, and the `encryption/` suite.

## Progress

**Tranche 2 (encryption cluster) — PR #6806.** Rebased after PRs #6803, #6804
and #6805 landed and independently converged `registerEncryptedType`,
`encrypt_attribute`'s "immediate path" branch, the decorator's idempotence
guard, `getAttributeType`, and most of the encryption test mocks. What #6806
carries on top:

- `encrypt_attribute`'s decorator and `validate_column_size` read `columns_hash`
  (`encryptable_record.rb:91,138-142`); `columnDefaultFor`,
  `cachedColumnDefaultFor` and the `NOT_CACHED` schema-cache peek are deleted,
  as is the already-registered-LengthValidator scan. `encrypts` no longer runs
  the length validation eagerly — that is `load_schema!`'s (`:126-130`).
- `columnsHash` is guarded on its own memo — `load_schema unless @columns_hash`
  (`model_schema.rb:428`) — which is what lets a `columns_hash` read from inside
  `load_schema!` resolve instead of re-entering the load. Without it the two
  reads above recurse; this is why the deviation existed.
- `isEncryptedAttribute` drops its `_attributeDefinitions` arm.
- Three call-mismatch baseline rows converged and were deleted (6 → 3).

**Still open** (the story's own split, minus the cluster above): the
schema/columns readers (`model-schema.ts`, `base.ts`, `attributes.ts`,
`inheritance.ts`, `persistence.ts`, `nested-attributes.ts`, `fixtures.ts`), the
attribute-methods readers (`activemodel/attribute-methods.ts`,
`activerecord/attribute-methods.ts`, `activemodel/model.ts`,
`activemodel/serialization.ts`), scope items 2 and 3
(`_schemaRevision` / `schemaStaleAgainstAncestors` / `ownSchemaMemo` /
`scrubSchemaSourcedDefinitions`), and scope item 5 (`enum.ts` provenance,
`secure-password.ts`). Scope item 4 (`replayOwnPendingDecorators`) is already
gone from `activemodel/src/attribute-registration.ts`.
