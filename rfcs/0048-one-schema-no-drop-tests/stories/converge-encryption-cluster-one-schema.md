---
title: "Add encrypted_posts to canonical TEST_SCHEMA; converge 5 encryption test files off bespoke schema (one-schema)"
status: blocked
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: null
claim: "2026-07-02T01:43:47Z"
assignee: "converge-encryption-cluster-one-schema"
blocked-by: 'MIS-SPECIFIED premise. Verified against vendor/rails 2026-07-01: ''encrypted_posts'' exists NOWHERE in Rails (rg empty). Rails EncryptedPost (test/models/post_encrypted.rb) is ''class EncryptedPost < Post; self.table_name = "posts"; encrypts :title,:body'' — it rides the canonical POSTS table. So AC ''add encrypted_posts to canonical TEST_SCHEMA matching Rails schema.rb shape exactly'' is impossible (no such Rails shape) and would ENTRENCH a divergence Rails lacks. Rails-faithful convergence = make trails EncryptedPost ride canonical posts (title/body already canonical); encrypted_books IS in schema.rb (l.157) and can be added. Also the 4 encrypted_posts files use isolated freshAdapter()+makeFreshModel DDL (adapter-form defineSchema IS one-schema-policed), so real convergence is a large multi-file rewrite onto canonical models+fixtures, >1 PR. encryption.test.ts (users.name) belongs to RFC 0025 converge-encryption-test-canonical-schema. Needs re-scope by RFC owner before work.'
closed-reason: null
---

## Context

The encryption test cluster declares the non-canonical table `encrypted_posts`
(defined in `packages/activerecord/src/encryption/test-helpers.ts:160`) and a
`users.name` column the canonical `users` lacks. Under one-schema
(`AR_ONE_SCHEMA=1`) these throw `OneSchemaViolation`. Verified 2026-07-01 by
probing under the flag with an emptied exclude:

- `encryption.test.ts` — `defineSchema table "users" declares column "name",
which is not on the canonical "users"`.
- `encryption/encryptable-record.test.ts`, `encryptable-record-api.test.ts`,
  `encryptable-record-message-pack-serialized.test.ts`, `encryption-schemes.test.ts`
  — `defineSchema requested table "encrypted_posts", which is not in canonical
TEST_SCHEMA`.

Per project convention (fidelity-first; add to canonical rather than invent a
bespoke shape), add `encrypted_posts` and any missing encryption columns
(including `users.name` if Rails' schema.rb carries it) to canonical
`test-helpers/test-schema.ts`, then converge all five files to reference canonical.
Read Rails `activerecord/test/cases/encryption/*` and `schema.rb` first.

## Acceptance criteria

- `encrypted_posts` (and any missing encryption columns) added to canonical
  `TEST_SCHEMA`, matching Rails schema.rb shape exactly.
- All 5 encryption files pass under one-schema and are removed from
  `eslint/one-schema-exclude.json`.
- Coordinates with `converge-encryption-test-canonical-schema` (RFC 0025) for
  `encryption.test.ts` — same TEST_SCHEMA addition; do not duplicate its work.
- No test renames.
