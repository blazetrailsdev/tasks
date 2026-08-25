---
title: "Add encrypted_posts to canonical TEST_SCHEMA; converge 5 encryption test files off bespoke schema (one-schema)"
status: done
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: 4406
claim: "2026-07-02T12:39:41Z"
assignee: "converge-encryption-cluster-one-schema"
blocked-by: null
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
