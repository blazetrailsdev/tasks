---
title: "sqlite3-adapter-siblings-ambient-connection"
status: ready
updated: 2026-07-27
rfc: "0029-sqlite-memory-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Audit finding from `audit-residual-memory-sites` (RFC 0029).

Rails' sqlite3 adapter test directory uses `:memory:` in only **two** files:
`sqlite3_adapter_test.rb` (18) and `transaction_test.rb` (1). Every sibling
file uses **zero** — they run against the ambient `@connection`
(`ActiveRecord::Base.lease_connection` in `setup`):

`vendor/rails/activerecord/test/cases/adapters/sqlite3/` — `quoting_test.rb`,
`json_test.rb`, `collation_test.rb`, `bind_parameter_test.rb`,
`virtual_table_test.rb`, `virtual_column_test.rb`,
`sqlite3_adapter_prevent_writes_test.rb` — all 0 `:memory:`.

trails constructs a throwaway in-memory adapter in `beforeEach` in each:

- `adapters/sqlite3/quoting.test.ts:12`
- `adapters/sqlite3/json.test.ts:20`
- `adapters/sqlite3/collation.test.ts:13`
- `adapters/sqlite3/bind-parameter.test.ts:12`
- `adapters/sqlite3/virtual-table.test.ts:13,43`
- `adapters/sqlite3/virtual-column.trails.test.ts:10`
- `adapters/sqlite3/sqlite3-adapter-prevent-writes.test.ts:13`
- `adapters/sqlite3/bigint-roundtrip.test.ts:13`

**Verdict: divergence.** These should derive their connection from the ambient
file-backed test config the way Rails does, not spin a private `:memory:` DB.

## Acceptance criteria

- [ ] Each listed file obtains its adapter from the ambient test connection
      (the RFC-0029 ambient-connection helper introduced by
      `adapter-test-ambient-connection`, if one landed) instead of
      `new BetterSQLite3Adapter(":memory:")`.
- [ ] Tables the tests create are still cleaned up deterministically now that
      the DB outlives the test (the "throwaway `:memory:` tables" comments
      become wrong — update or delete them).
- [ ] Test names unchanged.
- [ ] Split across PRs if needed to stay under 500 LOC; register follow-ups via
      `tasks new`. Do NOT touch `adapters/sqlite3/sqlite3-adapter.test.ts` or
      `adapters/sqlite3/transaction.test.ts` (fidelity-correct, out of scope).
