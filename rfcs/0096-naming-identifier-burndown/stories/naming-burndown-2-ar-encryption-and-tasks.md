---
title: "Burn down the remaining 26 naming call-argument rows in encryption, database tasks and query logs"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 104
pr: 6433
claim: "2026-08-12T19:19:34Z"
assignee: "naming-burndown-2-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2. A full `API_COMPARE_FORCE=1 pnpm parity:api --calls` on `origin/main` at ff1fa59d4 (2026-08-11) reports **532 remaining `naming` rows** — call sites where a
ported body passes an argument whose local/parameter identifier was renamed away from Rails'. The wave-1 per-package stories are all done or closed; this story owns the residue in encryption, database tasks and query logs: **26 rows across 13 files**.

| Rows | File                                                                   |
| ---: | ---------------------------------------------------------------------- |
|    5 | `packages/activerecord/encryption/encryptable-record.ts`               |
|    3 | `packages/activerecord/encryption/extended-deterministic-queries.ts`   |
|    3 | `packages/activerecord/query-logs.ts`                                  |
|    3 | `packages/activerecord/tasks/mysql-database-tasks.ts`                  |
|    2 | `packages/activerecord/encryption/encrypted-attribute-type.ts`         |
|    2 | `packages/activerecord/encryption/encryptor.ts`                        |
|    2 | `packages/activerecord/tasks/database-tasks.ts`                        |
|    1 | `packages/activerecord/encryption/auto-filtered-parameters.ts`         |
|    1 | `packages/activerecord/encryption/cipher.ts`                           |
|    1 | `packages/activerecord/encryption/envelope-encryption-key-provider.ts` |
|    1 | `packages/activerecord/encryption/message-pack-message-serializer.ts`  |
|    1 | `packages/activerecord/encryption/message-serializer.ts`               |
|    1 | `packages/activerecord/tasks/sqlite-database-tasks.ts`                 |

Representative rows (Ruby args → TS args):

- `encryption/auto-filtered-parameters.ts#applyCollectedAttributes` calling `apply_filter`: Ruby `ref:klass, ref:attribute` → TS `ref:klass, ref:attr`
- `encryption/cipher.ts#tryToDecryptWithEach` calling `decrypt`: Ruby `ref:encryptedText` → TS `ref:encryptedMessage`
- `encryption/encryptable-record.ts#encryptAttribute` calling `encrypted_attribute_was_declared`: Ruby `ref:this, ref:name` → TS `ref:modelClass, ref:name`
- `encryption/encryptable-record.ts#validateColumnSize` calling `validates_length_of`: Ruby `ref:attributeName, kwargs{maximum=ref:limit}` → TS `ref:attribute, kwargs{maximum=ref:limit}`
- `encryption/encryptable-record.ts#ciphertextFor` calling `read_attribute_before_type_cast`: Ruby `ref:attributeName` → TS `ref:resolvedName`
- `encryption/encryptable-record.ts#decryptAttributes` calling `update_columns`: Ruby `ref:decryptAttributeAssignments` → TS `ref:assignments`
- `encryption/encryptable-record.ts#cantModifyEncryptedAttributesWhenFrozen` calling `add`: Ruby `ref:toSym, str:can't be modified because it is encrypted` → TS `ref:attr, str:can't be modified because it is encrypted`
- `encryption/encrypted-attribute-type.ts#deserialize` calling `deserialize`: Ruby `ref:decrypt` → TS `ref:decrypted`

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `o`, the TS name is `o`. No behavior changes and no public
surface changes — these are body-local identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

The counts above are a snapshot; re-measure before claiming, since sibling
wave-2 stories land against disjoint file sets but the totals move.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `pnpm parity:api:calls:args:report` (after
      `API_COMPARE_FORCE=1 pnpm parity:api --calls` on a fresh `pnpm build`)
      shows the `naming` class down by the rows this story converged, and no
      new `shape` rows.
- [ ] Any row deliberately left standing is an a1/a3 finding, called out in the
      PR body with the follow-up story or RFC it belongs to.
- [ ] `pnpm lint` and the touched packages' tests pass; no public API change.
