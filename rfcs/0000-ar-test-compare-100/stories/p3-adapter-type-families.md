---
title: "P3 — adapter type-families (PG ~94 + MySQL ~41)"
status: in-progress
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 300
pr: 3014
claim: "2026-06-08T00:40:43Z"
assignee: "p3-adapter-type-families"
blocked-by: null
---

## Context

**PG (~94, 30 files):** transaction (6), array (6, → I-3 done), referential_integrity (5),
postgresql_adapter (5), optimizer_hints (5), enum (5, → I-2), deferred_constraints (5),
create_unlogged_tables (5), collation (5), + 18 smaller files.
**MySQL (~41, 15 files):** unsigned_type (5), transaction (5), optimizer_hints (5),
mysql_explain (4), auto_increment (4), sp (3), set (3), nested_deadlock (3), rest.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=postgresql PG_TEST_URL=… pnpm vitest run <file>`.
I-1 gates dump-bearing cases; I-2 gates PG `enum_test.rb` (5).

## Acceptance criteria

- [ ] Each adapter-dir file un-skipped in its own small sibling PR.
- [ ] All PG + MySQL adapter-dir skips → 0.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Split by family for larger families. Rails:
`test/cases/adapters/postgresql/**`, `test/cases/adapters/mysql2/**`,
`test/cases/adapters/abstract_mysql_adapter/**`.
