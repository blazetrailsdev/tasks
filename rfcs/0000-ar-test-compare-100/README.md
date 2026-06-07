---
rfc: "0000-ar-test-compare-100"
title: "ActiveRecord test:compare 100%: phase-ordered un-skip campaign"
status: draft
created: 2026-06-07
updated: 2026-06-07
owner: "@dmarano"
packages:
  - activerecord
clusters:
  - hygiene
  - unblockers
  - clusters
  - adapter
  - integrated
---

<!-- Unnumbered until merge: keep `rfc:` as 0000-ar-test-compare-100. -->

# RFC — ActiveRecord test:compare 100%: phase-ordered un-skip campaign

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
```

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

## Stories

| ID                                                                          | Title                                 | Phase | ~Skips | Status | Dep                      |
| --------------------------------------------------------------------------- | ------------------------------------- | :---: | -----: | ------ | ------------------------ |
| [h3-reclassify-permanent-skips](stories/h3-reclassify-permanent-skips.md)   | Reclassify permanent skips            |   0   |    ~20 | ready  | —                        |
| [i1-schema-dumper-columnspec-u3](stories/i1-schema-dumper-columnspec-u3.md) | Schema-dumper columnSpec U3           |   1   |    ~60 | ready  | —                        |
| [i2-enum-cast](stories/i2-enum-cast.md)                                     | type_for_attribute enum write-casting |   1   |    ~15 | ready  | —                        |
| [f1-insert-all-cluster](stories/f1-insert-all-cluster.md)                   | insert_all cluster                    |   2   |     41 | ready  | —                        |
| [f2-connection-pool-campaign](stories/f2-connection-pool-campaign.md)       | Connection-pool / multi-db            |   2   |    ~39 | ready  | —                        |
| [f3-migration-runner-campaign](stories/f3-migration-runner-campaign.md)     | Migration runner                      |   2   |    ~23 | ready  | —                        |
| [f4-transactions-campaign](stories/f4-transactions-campaign.md)             | Transactions + callbacks              |   2   |    ~47 | ready  | —                        |
| [f5-query-cache-residuals](stories/f5-query-cache-residuals.md)             | Query-cache residuals                 |   2   |     ~5 | ready  | f7                       |
| [f6-nested-attributes](stories/f6-nested-attributes.md)                     | Nested-attributes cluster             |   2   |    ~25 | ready  | —                        |
| [f7-fixtures-backed-clusters](stories/f7-fixtures-backed-clusters.md)       | Fixtures-backed clusters              |   2   |    ~40 | ready  | i1                       |
| [f8-small-core-leftovers](stories/f8-small-core-leftovers.md)               | Small core leftovers                  |   2   |    ~29 | ready  | —                        |
| [p3-adapter-type-families](stories/p3-adapter-type-families.md)             | Adapter type-families (PG+MySQL)      |   3   |   ~135 | ready  | —                        |
| [w7-named-inner-joins-fix](stories/w7-named-inner-joins-fix.md)             | \_namedInnerJoins merger fix          |   4   |   gate | ready  | —                        |
| [w7-associations-relation-tail](stories/w7-associations-relation-tail.md)   | Associations + relation tail          |   4   |   ~435 | ready  | w7-named-inner-joins-fix |

## Changelog

- 2026-06-07: initial RFC, migrated from `workplan.md`, attack-plan, 100-plan, index.
