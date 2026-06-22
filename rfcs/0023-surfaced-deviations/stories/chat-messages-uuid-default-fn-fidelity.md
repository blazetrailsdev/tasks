---
title: "Converge chat_messages uuid PK defaults to Rails' uuid_generate_v4() / pgcrypto split"
status: ready
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 12
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3836 (story `persistence-pg-uuid-pk-create`), which added
`POSTGRESQL_SPECIFIC_SCHEMA` in
`packages/activerecord/src/test-helpers/test-schema.ts` mirroring
`vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:9-16`.

Rails' DDL:

- `create_table :chat_messages, id: :uuid, **uuid_default` where
  `uuid_default = supports_pgcrypto_uuid? ? {} : { default: "uuid_generate_v4()" }`
  — i.e. the PG default `gen_random_uuid()` (pgcrypto) when available, else the
  uuid-ossp `uuid_generate_v4()`.
- `create_table :chat_messages_custom_pk` with
  `t.uuid :message_id, primary_key: true, default: "uuid_generate_v4()"`
  (hardcoded uuid-ossp).

Our port uses `gen_random_uuid()` for BOTH tables unconditionally (documented in
the schema header) because it is built into PostgreSQL 13+ and needs no
extension, whereas `uuid_generate_v4()` requires the uuid-ossp extension to be
enabled in the test database (Rails does `enable_extension!("uuid-ossp")` in the
specific schema). This is functionally equivalent for the two
populate-the-id tests but diverges from the exact Rails DDL.

## Acceptance criteria

- [ ] Decide convergence path: enable the `uuid-ossp` extension on the postgres
      test DB (mirroring Rails' `enable_extension!`) so `defineSchema` can emit
      `uuid_generate_v4()` for `chat_messages_custom_pk`, and apply the
      `supports_pgcrypto_uuid?`-conditional default for `chat_messages`.
- [ ] `POSTGRESQL_SPECIFIC_SCHEMA` defaults match Rails' DDL exactly (pgcrypto
      split for `chat_messages`, `uuid_generate_v4()` for `chat_messages_custom_pk`).
- [ ] Existing `create model with [custom named] uuid pk populates id` tests
      still pass on the postgres lane; sqlite/mysql skip cleanly.
