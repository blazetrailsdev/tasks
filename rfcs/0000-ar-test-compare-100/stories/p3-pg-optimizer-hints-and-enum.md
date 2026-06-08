---
title: "P3 — PG optimizer hints and enum (10 skips)"
status: ready
updated: 2026-06-08
rfc: "0000-ar-test-compare-100"
cluster: adapter
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Mirrors Rails `test/cases/adapters/postgresql/optimizer_hints_test.rb` and
`test/cases/adapters/postgresql/enum_test.rb`.

**postgresql/optimizer-hints.test.ts (5):** `optimizer hints`, `optimizer hints with count
subquery`, `optimizer hints is sanitized`, `optimizer hints with unscope`, and
`optimizer hints with or` — verifies that `/*+ ... */` PG hint comments (via
`pg_hint_plan` extension) are injected correctly and survive query transformations.

**postgresql/enum.test.ts (5 hard skips):** `invalid enum update`, `no oid warning`,
`works with activerecord enum`, `schema dump scoped to schemas`, and `schema load scoped
to schemas`. The file also contains 2 `it.skipIf(pgServerVersion < 100000)` tests for
`schema dump added enum value` and `schema dump renamed enum value` (PG 10+ only) — these
are conditional, not permanent, and should be un-skipped or left as `skipIf` as
appropriate once the gap is fixed.

All 5 hard skips in optimizer-hints and 5 hard skips in enum are standard Rails-mirrored
tests.

Local-verify-only until RFC 0012 `wire-adapter-dir-lane` adds the CI lane.
Run: `TEST_ADAPTER=postgresql PG_TEST_URL=… pnpm vitest run <file>`.

## Acceptance criteria

- [ ] All 5 skips in `postgresql/optimizer-hints.test.ts` un-skipped and passing.
- [ ] All 5 hard `it.skip` entries in `postgresql/enum.test.ts` un-skipped and passing.
- [ ] The 2 `skipIf(pgServerVersion < 100000)` entries in `enum.test.ts` verified as
      correct conditional guards (pass on PG 10+) — not converted to permanent skips.
- [ ] No regressions in the broader PG adapter test suite.
- [ ] CI-gated once RFC 0012 `wire-adapter-dir-lane` merges.

## Notes

Optimizer-hints: Rails source `activerecord/lib/active_record/relation/query_methods.rb`
(`optimizer_hints`). Requires `pg_hint_plan` extension installed in the test DB; confirm
test-helper setup or add an `it.skipIf` guard when the extension is absent.

Enum: Rails source `activerecord/lib/active_record/connection_adapters/postgresql/oid/enum.rb`
and `schema_dumper.rb`. The `schema dump/load scoped to schemas` tests exercise
multi-schema enum visibility; they may require the test DB to have a non-default
`search_path`.
