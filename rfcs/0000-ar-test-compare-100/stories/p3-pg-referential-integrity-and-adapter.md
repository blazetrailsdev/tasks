---
title: "P3 — PG referential integrity and adapter (10 skips)"
status: done
updated: 2026-06-09
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 150
priority: 6
pr: 3055
claim: "2026-06-09T12:59:59Z"
assignee: "p3-pg-referential-integrity-and-adapter"
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/postgresql/referential_integrity_test.rb` and
`test/cases/adapters/postgresql/postgresql_adapter_test.rb`.

**postgresql/referential-integrity.test.ts (5):** verifies that the PG adapter's
`disable_referential_integrity` block suppresses FK violations, emits warnings on invalid
FKs, and correctly restores integrity after the block — including inside transactions and
nested transactions.

**postgresql/postgresql-adapter.test.ts (5):** connection-level adapter behavior —
`only reload type map once for every unrecognized type`, `reconnect after bad connection
on check version`, `pk and sequence for with collision pg class oid`,
`translate no connection exception to not established`, and `reconnection error`.

All 10 are standard Rails-mirrored tests. The referential-integrity tests exercise FK
constraint deferral via `SET CONSTRAINTS ALL DEFERRED`; the adapter tests exercise
connection lifecycle and type-map caching.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=postgresql PG_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 5 skips in `postgresql/referential-integrity.test.ts` un-skipped and passing.
- [ ] All 5 skips in `postgresql/postgresql-adapter.test.ts` un-skipped and passing.
- [ ] No regressions in the broader PG adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Rails source: `activerecord/lib/active_record/connection_adapters/postgresql/referential_integrity.rb`
(`disable_referential_integrity`) and `postgresql_adapter.rb` (type-map cache, reconnect
logic). The `pk_and_sequence_for` collision test exercises a rare OID-reuse edge case in
`pg_class`; check whether the test can be reproduced with a synthetic fixture or requires
a specific PG catalog state.
