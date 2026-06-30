---
title: "converge-persistence-chatmessages-one-schema"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

> **SUPERSEDED (RFC 0048 re-spec, 2026-06-30).** Folded into `converge-persistence-validations-one-schema`.
> Do not work this story — it overlapped a parent cluster story and used the
> shallow-rename framing. Kept as draft for history.

## Context

Split off from `converge-persistence-validations-one-schema` (RFC 0048). PR #4317
converged `validations.test.ts`. `persistence.test.ts` is already mostly canonical;
the one remaining bespoke block is the PostgreSQL-only uuid-PK section (~line 1592)
that calls `defineSchema(POSTGRESQL_SPECIFIC_SCHEMA)` for `chat_messages` /
`chat_messages_custom_pk` (uuid PKs, gated to the postgres adapter). These are real
Rails tables in `postgresql_specific_schema.rb`, but uuid is PG-only so they cannot
join the cross-adapter canonical `TEST_SCHEMA`.

## Acceptance criteria

- Resolve the `chat_messages` block in `packages/activerecord/src/persistence.test.ts`
  so the file carries no bespoke `defineSchema` for one-schema mode — either add the
  uuid tables to a canonical postgres-specific schema helper, or scratch per the
  one-schema design.
- Passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Test names match Rails verbatim. Single PR from main, <500 LOC.
