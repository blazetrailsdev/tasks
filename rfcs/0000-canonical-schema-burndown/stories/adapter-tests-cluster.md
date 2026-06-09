---
title: "adapters/ (sqlite / pg / mysql) → canonical schema or isolated-by-design"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the adapter-dir files (RFC §Rollout phase 4). These are adapter-gated in
CI (run under their `ARCONN`/`TEST_ADAPTER` backend; memory
`reference_ci_adapter_testing_model`). Many legitimately own a per-file schema for
DDL/type tests — those route through `setupAdapterSuite` (`beforeAll`, no
`dropExisting`, uniquely-named tables) and may keep a scoped
`eslint-disable-next-line` with a one-line reason. The fidelity bar still applies:
bodies matched to the Rails adapter test.

Files (remove each from the exclude JSON, or add a justified disable, as it lands):

- `adapters/sqlite3-adapter.test.ts` → `adapters/sqlite3/sqlite3_adapter_test.rb`
- `adapters/sqlite3/json.test.ts` → `adapters/sqlite3/json_test.rb`
- `adapters/abstract-mysql-adapter/mysql-explain.test.ts` → mysql explain cases
- `adapters/abstract-mysql-adapter/schema.test.ts` → mysql schema cases
- `adapters/postgresql/bind-parameter.test.ts` → `adapters/postgresql/bind_parameter_test.rb`
- `adapters/postgresql/define-schema-pg-types.test.ts` → PG type DDL cases
- `adapters/postgresql/foreign-table.test.ts` → `adapters/postgresql/foreign_table_test.rb`

## Acceptance criteria

- [ ] Each file either rides `TEST_SCHEMA` + fixtures, or owns an isolated
      uniquely-named schema via `setupAdapterSuite` with a justified
      `eslint-disable` (one-line reason).
- [ ] Each test body matches its Rails adapter counterpart word-for-word; test
      names unchanged.
- [ ] Touched files pass under their backend (`ARCONN`/`TEST_ADAPTER`); zero
      unjustified `require-canonical-schema` errors; files removed from the exclude
      JSON (or annotated).

## Notes

- DDL/type tests that genuinely own their schema are _already at the performance
  goal_ — the goal is fidelity + no collision, not "everything is a fixture."
