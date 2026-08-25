---
title: "Restore PG uuid-PK create tests (chat_messages / chat_messages_custom_pk)"
status: done
updated: 2026-06-22
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3836
claim: "2026-06-21T21:02:42Z"
assignee: "persistence-pg-uuid-pk-create"
blocked-by: null
---

## Context

Deferred from `persistence-port-residual-cluster` (RFC 0019). Two PostgreSQL-only
`persistence_test.rb` names:

- `test_create_model_with_uuid_pk_populates_id` (persistence_test.rb:559):
  `ChatMessage.create(content:)` populates a uuid `id`; reload by that id.
- `test_create_model_with_custom_named_uuid_pk_populates_id`
  (persistence_test.rb:568): `ChatMessageCustomPk.create(content:)` populates a
  custom-named uuid PK (`message_id`); reload by it.

Both are guarded `if current_adapter?(:PostgreSQLAdapter)`.

Findings: the canonical models already exist
(`packages/activerecord/src/test-helpers/models/chat-message.ts` —
`ChatMessage`, `ChatMessageCustomPk` on `chat_messages_custom_pk`). The tables
are defined only in Rails' PG-specific schema
(`vendor/rails/activerecord/test/schema/postgresql_specific_schema.rb:9,13`):
`create_table :chat_messages, id: :uuid, ...` and
`create_table :chat_messages_custom_pk, id: false` with a uuid `message_id` PK
(`uuid_default` → `gen_random_uuid()`/`uuid_generate_v4()`). They are absent
from the canonical SQLite `TEST_SCHEMA`. Needs: PG uuid-PK table additions
(behind a PG-only schema path, since `defineSchema` rejects `uuid` on non-PG
adapters) and PG uuid-PK create/populate support so `create` reads back the
DB-generated uuid.

## Acceptance criteria

- [ ] PG-only canonical schema entries for `chat_messages` (uuid `id`) and
      `chat_messages_custom_pk` (uuid `message_id` PK) with a uuid default
      function, only created on the postgres adapter.
- [ ] PG `create` populates the DB-generated uuid PK (default + custom-named).
- [ ] Restore both tests verbatim in `persistence.test.ts`, gated to the
      postgres adapter (e.g. `itIfSupports`/adapter guard); real assertions.
- [ ] postgres CI lane passes; sqlite/mysql lanes skip cleanly; lint +
      typecheck clean.
