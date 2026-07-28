---
title: "sqlite3-connection-adapter-tests-ambient"
status: in-progress
updated: 2026-07-28
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5500
claim: "2026-07-28T13:26:40Z"
assignee: "sqlite3-connection-adapter-tests-ambient"
blocked-by: null
closed-reason: null
---

## Context

Audit finding from `audit-residual-memory-sites` (RFC 0029).

The `connection-adapters/sqlite3*` cluster (trails' pre-RFC-0026 layout) also
builds private `:memory:` adapters where the matching Rails file uses the
ambient `@connection`:

- `connection-adapters/sqlite3/quoting.test.ts:348` — Rails
  `adapters/sqlite3/quoting_test.rb` (0 `:memory:`, ambient).
- `connection-adapters/sqlite3-copy-table.test.ts:9` — Rails
  `adapters/sqlite3/copy_table_test.rb` (0 `:memory:`, ambient `@connection`).
- `connection-adapters/sqlite3-adapter.query-transformers.test.ts:17` — Rails
  `adapters/sqlite3/sqlite3_adapter_test.rb` query-transformer cases run on the
  ambient connection.

`connection-adapters/sqlite3-adapter.hash-constructor.test.ts` is **not** in
scope: its `:memory:` (line 36) is the subject under test (accepting a
`{ database: ":memory:" }` hash), i.e. fidelity-correct as a spec value.

## Acceptance criteria

- [ ] The three listed files derive their adapter from the ambient file-backed
      test connection instead of `new BetterSQLite3Adapter(":memory:")`.
- [ ] Table cleanup made deterministic (the "throwaway `:memory:` tables"
      comments become false — update or remove).
- [ ] Test names unchanged.
- [ ] `hash-constructor.test.ts` left alone.
