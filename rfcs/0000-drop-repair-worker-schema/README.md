---
rfc: "0000-drop-repair-worker-schema"
title: "Drive repairWorkerSchema firings to zero, then delete it"
status: draft
created: 2026-07-24
updated: 2026-07-24
owner: "@deanmarano"
packages:
  - "activerecord"
clusters: []
---

## Summary

`repairWorkerSchema` (`packages/activerecord/src/test-helpers/schema-repair.ts:135`)
is a self-healing crutch for the shared per-worker AR test database. At the start
of **every** test file, `test-setup-dy.ts:67-78` reads the live column layout of
every table, compares each canonical table against `TEST_SCHEMA`, and
drop+recreates any whose shape has **drifted** — masking the fact that an
earlier file in the same worker reshaped a canonical table and never restored
it. RFC 0060's `gate-repairworkerschema-drops-behind-drift` (done, PR 3351)
already gated it to fire only on _real_ drift; this RFC drives those residual
real-drift firings to **zero**, then deletes the machinery.

End state: repairs fire **zero** times across a full CI run, at which point
`schema-repair.ts`, its call in `test-setup-dy.ts`, and `schema-repair.test.ts`
are deleted. Removing RFC 0028's `retry: 2` shared-DB flake masking is gated
partly on this.

## Measured baseline (Phase 1)

Instrumented throwaway run — PR #5227, CI run `30106168203`, commit
`1cc5f98ef`, all active AR lanes (sqlite, postgres ×2 shards, maria ×2 shards;
the mysql:8 lane is temporarily disabled so maria stands in for the MySQL
family). Each firing appended a JSONL record attributing the repaired table(s),
backend, and the **triggering (victim) test file** whose setup detected the
drift.

**Total firings: 12** — sqlite 5, postgres 4, mysql/maria 3.

The _triggering file_ is the victim (the next file to run after the culprit);
the stable signal is the **drifted table set**, which fingerprints the culprit
suite. Grouped by drift source:

| #   | Drift source (table set)                                   | Firings | Backends                | Culprit (leaves canonical shape drifted)                                                                                                                                 |
| --- | ---------------------------------------------------------- | ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `group`, `select`, `distinct`, `distinct_select`, `values` | 3       | sqlite, postgres, mysql | `reserved-word.test.ts` — drops the canonical reserved-word tables (`:65-98`) and recreates bespoke shapes / drops without restoring                                     |
| 2   | `courses`, `colleges`, `professors`, `courses_professors`  | 2       | sqlite                  | a HABTM suite drops the many-to-many canonical tables (candidates: `has-and-belongs-to-many-associations.test.ts`, `multiple-db.test.ts`, `base-prevent-writes.test.ts`) |
| 3   | `children`                                                 | 2       | postgres, sqlite        | a tree/nested suite reshapes `children` (candidates: `persistence.test.ts`, `associations/required.test.ts`, `adapters/postgresql/uuid.test.ts`)                         |
| 4   | `fk_test_has_pk`, `fk_test_has_fk`                         | 1       | sqlite                  | `adapter.test.ts` (and `insert-all.test.ts`) `defineSchema` the FK-test tables                                                                                           |
| 5   | `CamelCase`                                                | 1       | postgres                | `schema-dumper.test.ts` `defineSchema({ CamelCase: … })`                                                                                                                 |
| 6   | `lessons_students`, `students`, `posts`, `topics`          | 1       | mysql                   | a HABTM/students suite reshapes these canonical tables                                                                                                                   |
| 7   | `subscribers`                                              | 1       | mysql                   | one of `adapter`/`finder`/`insert-all`/`has-many-associations`/`use-fixtures` `defineSchema` `subscribers`                                                               |
| 8   | `items`                                                    | 1       | postgres                | `readonly.test.ts` / `transactions.trails.test.ts` `defineSchema({ items: … })`                                                                                          |

All drifted tables are **canonical** (present in `TEST_SCHEMA`) — repair never
touches bespoke tables, so every firing is a canonical suite failing to restore
shape. The systemic fix aligns with RFC 0059 (drop `defineSchema`): each source
suite must restore the canonical shape, or run against its own scratch table /
transactional rollback, so no sibling file ever sees drift.

## Plan

One burndown story per drift source above (priority = firing count rank), then a
capstone that deletes `schema-repair.ts`, the `test-setup-dy.ts` call, and
`schema-repair.test.ts` once a re-measured CI run proves zero firings. The
capstone stays blocked on the burndown stories.

## Related

- RFC 0060 — reduce-test-drop-churn (gated repair behind real drift; closed)
- RFC 0059 — drop-defineschema-mirror-create-table (the systemic fix)
- RFC 0028 — ci-cost-optimization (`retry: 2` masking removal gated on this)
- RFC 0019 — bespoke-table drift (out of scope here; repair only covers canonical)
