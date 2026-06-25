---
rfc: "0016-ar-test-compare-100"
title: "ActiveRecord test:compare 100%: phase-ordered un-skip campaign"
status: superseded
created: 2026-06-07
updated: 2026-06-22
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - hygiene
  - unblockers
  - clusters
  - adapter
  - integrated
  - core-residuals
superseded-by: "0030-ar-test-compare-residual-burndown"
---

<!-- Unnumbered until merge: keep `rfc:` as 0016-ar-test-compare-100. -->

# RFC 0016 — ActiveRecord test:compare 100%: phase-ordered un-skip campaign

## Summary

Drives `@blazetrails/activerecord` from **88.6%** (6959/7856, 890 skipped,
snapshot 2026-06-02) to 100%. Consolidates `workplan.md`,
`test-compare-100-attack-plan.md`, `activerecord-100-plan.md`, and
`activerecord-index.md`. Those four docs are deleted by `decommission-docs`
once this RFC's stories are merged.

Refresh before each story: `pnpm test:compare --cached --json --package activerecord`.

## Phase spine

```text
Phase 0  H-3: reclassify ~20 permanent skips (do first; shrinks denominator)
Phase 1  I-1: schema-dumper columnSpec U3 (gates ~60)
         I-2: enum cast (blocker; gates relation enum×5 + PG enum×5)
Phase 2  parallel clusters (CI-runnable on all three backends):
         F-1 insert_all (41) · F-2 pool (39) · F-3 migration (23) · F-4 transactions (47)
         F-5 query-cache (5) · F-6 nested-attrs (25) · F-7 fixtures (40) · F-8 core (29)
Phase 3  adapter type-families: PG (~94) + MySQL (~41)
         local-verify until RFC 0012 wire-adapter-dir-lane adds the CI lane
Phase 4  integrated tail: associations (265) + relation (170) — LAST, audit-gated
Phase 5  core-residuals: un-owned core skips surfaced after F-8 (#3012) closed —
         F-9a adapter (~44) · F-9b stmt-cache/binds (20) · F-9c quoting (15)
         F-9d autosave (11) · F-9e locking (11) · F-9f counter-cache (5) · F-9g tail (~50)
```

**Snapshot 2026-06-10:** `test:compare --package activerecord` = **92.6%**
(7241/7816, **575 skipped**). All 575 bucket into the phases above; Phase 5 captures
the ~175 core skips that F-8 (`f8-small-core-leftovers`, done #3012, scoped ~29) never
covered. `defaults_test.rb` (13, schema-dump defaults) stays under I-1.

**Adapter CI structure:** core + `adapters/sqlite3/**` run on all three backends
via `describeIfPg`/`describeIfMysql`. `adapters/postgresql/**` + MySQL dirs are
excluded from the shared run; need `TEST_ADAPTER=postgresql/mysql2` (RFC 0012).

## Deferred / permanent-skip

| Category             | Scope                                                                                                             | Action                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| YAML / Marshal       | `base.test.ts` (6), `schema-cache.test.ts` (2), assoc (5), `hstore.test.ts` (1)                                   | H-3 → `unported-files.ts`                    |
| Thread / fork        | `query-cache.test.ts` (4), `connection-pool.test.ts` (14), pool fork (5), `prepared-statement-status.test.ts` (1) | H-3 → `unported-files.ts`                    |
| Externally blocked   | `standalone-connection.test.ts` (4) — no `StandaloneConnection` in vendored Rails                                 | leave `it.skip`; re-open on snapshot refresh |
| Phase-G gated        | `nested-error.test.ts` (4), strong-params nested-assoc (2)                                                        | deferred to Phase G                          |
| Relation design gaps | `eager_load` toSql+STI (3); parameterized join strings R6c (2)                                                    | deferred; needs design                       |

## Changelog

- 2026-06-15: move the 5 remaining open stories (persistence-query-constraints-save-reload-tests, sqlite3-copy-table-test-port, strict-loading-new-record-gate-in-loaders, timestamp-index-created-for-both-timestamps, virtual-reconcile-warm-schema-cache) to RFC 0030-ar-test-compare-residual-burndown, which supersedes this RFC's residual-skip campaign. The 83 closed stories stay here as the historical record.
- 2026-06-10: add Phase 5 core-residuals (F-9a…F-9g) for the ~175 un-owned core skips surfaced after F-8 (#3012) closed; snapshot refreshed to 92.6% (575 skipped).
- 2026-06-08: decompose p3-adapter-type-families into 12 child stories (8 MySQL + 4 PG residual).
- 2026-06-07: initial RFC, migrated from `workplan.md`, attack-plan, 100-plan, index.
