---
title: "adapters/ (sqlite / pg / mysql) → canonical schema or isolated-by-design"
status: in-progress
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 9
pr: 3118
claim: "2026-06-11T12:45:21Z"
assignee: "adapter-tests-cluster"
blocked-by: null
---

## Context

Convert (or explicitly mark isolated-by-design) the adapter test files. Unlike
the model-layer files, several of these **own their schema legitimately** — an
adapter/DDL test that creates and drops its own table is not a fidelity gap. For
those, a scoped `eslint-disable` with a one-line reason is acceptable; the bar
is "no shared-table collision," not "ride TEST_SCHEMA."

Files (confirm exclude-JSON membership at claim time):

- `adapters/abstract-mysql-adapter/mysql-explain.test.ts` (~188 LOC) →
  `adapters/abstract_mysql_adapter/mysql_explain_test.rb`
- `adapters/abstract-mysql-adapter/schema.test.ts` (~208 LOC) →
  `active_record_schema_test.rb`
- `adapters/postgresql/bind-parameter.test.ts` (~71 LOC) → `bind_parameter_test.rb`
- `adapters/postgresql/define-schema-pg-types.test.ts` (~73 LOC) — PG-types
  harness, no Rails counterpart; isolated-by-design
- `adapters/postgresql/foreign-table.test.ts` (~184 LOC) →
  `adapters/postgresql/foreign_table_test.rb`
- `adapters/sqlite3-adapter.test.ts` (~645 LOC) →
  `adapters/sqlite3/sqlite3_adapter_test.rb`
- `adapters/sqlite3/json.test.ts` (~67 LOC) → `coders/json_test.rb`

## Acceptance criteria

- [ ] For each file, decide: (a) model-layer test → ride `TEST_SCHEMA` + canonical
      models + fixtures; or (b) genuine adapter/DDL test owning its schema →
      keep its own table but ensure the name is **file-unique** (no shared-table
      collision) and add a scoped `eslint-disable` with a one-line reason.
- [ ] Where a Rails counterpart exists, match bodies word-for-word. Test names
      unchanged.
- [ ] Each file removed from the exclude JSON (category (a)) or carries a
      justified scoped disable (category (b)); no blanket file-level disables.
- [ ] `pnpm vitest run <each file>` passes on its target adapter (PG/MySQL files
      are CI-gated — verify on the right ARCONN).

## Definition of done

Every adapter file either rides the canonical schema or owns a file-unique table
with a justified scoped disable. A blanket file-level `eslint-disable` does
**not** close this story.
