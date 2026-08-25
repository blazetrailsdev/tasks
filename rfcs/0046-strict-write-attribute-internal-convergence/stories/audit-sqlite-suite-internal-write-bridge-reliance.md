---
title: "Audit: which SQLite-suite models still depend on the internal-write bridge"
status: closed
updated: 2026-07-06
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Spike/audit delivered via audit-report skill (no PR): sqlite-suite-internal-write-bridge-reliance-20260706T200019Z.md. 101 bridge hits across ~15 bespoke models; routed to bridge-removal blocker list."
---

## Context

The internal-write bridge (`readonly-attributes.ts` `_writeAttribute`
`catch → writeCastValue`) may also be silently rescuing SQLite-visible bespoke
models whose tables aren't schema-warmed at construction. Before removing the
bridge we need to know the full set of SQLite-suite models that still depend on
it (beyond those already converged in PR #4027).

## Acceptance criteria

- [x] Temporarily make the bridge throw (or log) instead of seeding, run the
      SQLite AR suite, and enumerate every test + bespoke model that hits it.
- [x] Produce an inventory (file → model → missing column) and either fold the
      fixes into the declare stories or list them for the bridge-removal story.
- [x] Spike/audit only — no production code change required to close (deliver
      the inventory via the audit-report skill).

## Audit findings (2026-07-06)

Full report:
`~/.btwhooks/data/github/blazetrailsdev/trails/audits/sqlite-suite-internal-write-bridge-reliance-20260706T200019Z.md`

**Method:** temporary (reverted) hook in the `readonly-attributes.ts`
`_writeAttribute` `catch` logged `{model, table, column}` on each bridge seed;
ran the full SQLite suite (`ARCONN` unset →
`TRAILS_TEST_FORKS=4 pnpm vitest run packages/activerecord/`). All tests passed
(10359 passed / 637 skipped / 15 todo). The bridge fired **101 times across 33
distinct model|table|column combos spanning ~15 bespoke models**.

### Cluster A — encryption suite (≈90 hits): `encrypted_books` / `traffic_lights`

Bespoke encryption models on the canonical `encrypted_books` table (plus
`traffic_lights`) are constructed before async schema reflection warms the
column set, so the framework post-save `created_at`/`updated_at` write-back (and
a few `id` PK write-backs) miss `writeFromUser` and are rescued by the bridge.

| Model                                        | Table           | Column(s)                  | Hits | Defined in                                                    |
| -------------------------------------------- | --------------- | -------------------------- | ---- | ------------------------------------------------------------- |
| EncryptedBook                                | encrypted_books | created_at, updated_at     | 46   | test-helpers/models/book-encrypted.ts                         |
| EncryptedBookThatIgnoresCase                 | encrypted_books | created_at, updated_at     | 14   | test-helpers/models/book-encrypted.ts                         |
| EncryptedBookWithDowncaseName                | encrypted_books | created_at, updated_at     | 4    | test-helpers/models/book-encrypted.ts                         |
| EncryptedBookWithBinary                      | encrypted_books | created_at, updated_at     | 4    | test-helpers/models/book-encrypted.ts                         |
| EncryptedBookWithBinaryMessagePackSerialized | encrypted_books | created_at, updated_at     | 4    | encryption/test-helpers.ts                                    |
| EncryptedBookWithCustomCompressor            | encrypted_books | created_at, updated_at     | 2    | test-helpers/models/book-encrypted.ts                         |
| EncryptedBookNormalizedFirst                 | encrypted_books | created_at, updated_at     | 2    | test-helpers/models/book-encrypted.ts                         |
| EncryptedBookNormalizedSecond                | encrypted_books | created_at, updated_at     | 2    | test-helpers/models/book-encrypted.ts                         |
| BookThatWillFailToEncryptName                | encrypted_books | created_at, updated_at     | 2    | encryption/test-helpers.ts                                    |
| Book                                         | encrypted_books | created_at, updated_at, id | 3    | bespoke Book on encrypted_books                               |
| BookDate                                     | encrypted_books | created_at, updated_at     | 2    | encryption/encryptable-record.test.ts                         |
| MsgPackTextBook                              | encrypted_books | created_at, updated_at     | 2    | encryption/encryptable-record-message-pack-serialized.test.ts |
| EncryptedTrafficLightWithStoreState          | traffic_lights  | created_at, updated_at     | 2    | test-helpers/models/traffic-light-encrypted.ts                |

Route to the encryption declare/convergence stories (warm/declare the real
columns) — largest single blocker for bridge removal.

### Cluster B — one-off bespoke-table models (PK/FK write-back on insert)

| Model                  | Table                     | Column         | Test file                                   |
| ---------------------- | ------------------------- | -------------- | ------------------------------------------- |
| StvAuthor              | stv_authors               | id             | associations/source-type-validation.test.ts |
| PstGallery             | pst_galleries             | id             | associations/association-scope.test.ts      |
| JsonObj                | json_objs                 | id             | query-cache.test.ts                         |
| TimestampAttributePost | timestamp_attribute_posts | id             | timestamp.test.ts                           |
| DeepShip               | ships                     | deep_pirate_id | autosave-association.test.ts                |

Converge by declaring the real columns (or riding a canonical table).

### Cluster C — deliberate internal-path unit test (not incidental reliance)

| Model | Table | Column  | Test file                       |
| ----- | ----- | ------- | ------------------------------- |
| Post  | posts | content | attribute-methods/write.test.ts |

`write.test.ts:20–32` aliases `content → body` then calls
`p._writeAttribute("content", …)` directly to assert the low-level write. Not an
incidental dependency, but the bridge-removal story must update this test (assert
against a real column / the aliased `body` target) rather than treat it as a
declare gap.

### Follow-up routing

Hand this inventory to the bridge-removal story
(`remove-internal-write-bridge-converge-write-attribute-strict`) as its blocker
list: (1) encryption cluster, (2) five bespoke one-offs, (3) the `write.test.ts`
unit test. Only after all three converge (bridge hit count → 0) can the
`catch → writeCastValue` bridge be removed and `_writeAttribute` made strict.
