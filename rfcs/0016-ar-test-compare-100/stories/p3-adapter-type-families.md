---
title: "P3 — adapter type-families (PG ~94 + MySQL ~41)"
status: done
updated: 2026-06-08
rfc: "0016-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 300
pr: 3039
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

- [x] Each adapter-dir file un-skipped in its own small sibling PR.
- [x] All PG adapter-dir skips → 0 (23 sibling PRs merged via the fan-out; PR #3039 closed).
- [ ] All MySQL adapter-dir skips → 0 (decomposed into 8 child stories; see Notes).
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

**Closed/decomposed 2026-06-08.** The original aggregate story fanned out into ~23 merged
PG sibling PRs. PR #3039 was closed without merging (superseded by the sibling work).
The MySQL remainder (~26 skips across 8 families) has been decomposed into child stories
that supersede this story's MySQL scope:

- [p3-mysql-unsigned-type](p3-mysql-unsigned-type.md)
- [p3-mysql-auto-increment](p3-mysql-auto-increment.md)
- [p3-mysql-stored-procedures](p3-mysql-stored-procedures.md)
- [p3-mysql-set-and-enum](p3-mysql-set-and-enum.md)
- [p3-mysql-explain-and-hints](p3-mysql-explain-and-hints.md)
- [p3-mysql-transactions-deadlock](p3-mysql-transactions-deadlock.md)
- [p3-mysql-virtual-column](p3-mysql-virtual-column.md)
- [p3-mysql-charset-collation](p3-mysql-charset-collation.md)

Residual PG skips (not covered by the 23 merged PRs) are tracked in four additional
child stories: `p3-pg-transactions`, `p3-pg-referential-integrity-and-adapter`,
`p3-pg-optimizer-hints-and-enum`, `p3-pg-array-and-misc`.

Do not claim this story — claim the individual child stories instead.

Rails test dirs: `test/cases/adapters/postgresql/**`, `test/cases/adapters/mysql2/**`,
`test/cases/adapters/abstract_mysql_adapter/**`.
