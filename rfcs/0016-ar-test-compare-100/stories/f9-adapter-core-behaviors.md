---
title: "F-9a — adapter_test core behaviors"
status: claimed
updated: 2026-06-12
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 400
priority: 11
pr: null
claim: "2026-06-12T16:43:01Z"
assignee: "f9-adapter-core-behaviors"
blocked-by: null
---

## Context

Surfaced by the 2026-06-10 `test:compare --package activerecord` snapshot (92.6%,
575 skipped). `adapter.test.ts` carries **42 hard `it.skip` entries** — the single
largest un-owned core cluster. F-8 (#3012, done) did not cover these, and the
earlier phase stories that closed the _equivalent_ tests in their own files (F-4
transactions, F-5 query-cache, P-3 adapter type-families / referential-integrity —
all **done**) left `adapter.test.ts`'s own copies skipped. These are genuine orphan
residue, NOT duplicates of the done stories.

**Single test file → single owner.** All 42 skips live in one file
(`packages/activerecord/src/adapter.test.ts`), so this stays one story shipped as
**sequential same-owner sub-PRs** — do NOT spin file-overlapping sibling stories
(they would collide on `adapter.test.ts`).

**Dedup with [[f7b-adapter-model-comment-clusters]] (still `ready`):** f7b owns the
~10 SQLite-runnable model-backed / API-shape skips and they are OUT OF SCOPE here:
`update prepared statement`, `create record with pk as zero`, both `remove index …
wrong column name` (+ positional), both `#exec_query … result set`, `exceptions from
notifications are not translated`, `select methods passing a (association) relation`,
`type_to_sql returns a String for unmapped types`. Land f7b first or coordinate the
shared file.

## Sub-PR breakdown (themed, sequential; each ≤500 LOC)

1. **Transaction-state reset/restore/sync (~13, ~250 LOC)** — `reconnect after a
disconnect`; materialized/unmaterialized transaction state `is reset` /
   `can be restored` after reconnect+disconnect (7); `transaction restores` /
   `active transaction is restored` / `dirty transaction cannot be restored` after
   remote disconnection (3); `#active? is synchronized`, `#verify! is synchronized`;
   `invalidates transaction on rollback error`. Plus the 2 bind probes
   `select all insert update delete with [casted] binds`.
2. **Exception translation + referential integrity (~6, ~150 LOC)** — `value limit
violations…` / `numeric value out of ranges are translated to specific
exception`; `disable referential integrity`; foreign-key violations translated
   `with validate false` / `on insert` / `on delete`. Backend-gated (PG/MySQL).
3. **Query-cache + truncate + pk-reset (~6, ~150 LOC)** — `create with query
cache`; `truncate` / `… with query cache` / `truncate tables with query cache`;
   `reset empty table with custom pk`; `reset table with non integer pk`.
4. **Backend introspection probes (~5, ~80 LOC)** — `charset`, `show nonexistent
variable returns nil`, `not specifying database name for cross database
selects`, `current database`, `advisory locks enabled?`. MySQL/PG only via
   `describeIf*`; local-verify until RFC 0012 wires the adapter-dir CI lane.

## Acceptance criteria

- [ ] Drive `adapter.test.ts` to 0 matched-skips EXCLUDING the f7b-owned ~10
      (track those under f7b), shipping the four themed sub-PRs above; any
      genuinely-permanent residue reclassified in `unported-files.ts` with a reason.
- [ ] `test:compare --cached --package activerecord` confirms the drop per batch.
- [ ] Touched test files only (per CLAUDE.md — no full-suite run).

## Notes

Ours: `packages/activerecord/src/adapter.test.ts`. Rails:
`activerecord/test/cases/adapter_test.rb`. Backend-specific entries (themes 2–4)
gate to MySQL/PG via `describeIf*` and are local-verify-only until RFC 0012
`wire-adapter-dir-lane` merges. Coordinate the shared file with f7b.
