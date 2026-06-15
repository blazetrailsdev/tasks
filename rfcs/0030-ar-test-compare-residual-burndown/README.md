---
rfc: "0030-ar-test-compare-residual-burndown"
title: "ActiveRecord test:compare 94→100: residual skip burndown"
status: draft
created: 2026-06-15
updated: 2026-06-15
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - associations
  - clusters
  - unblockers
  - adapter
  - core-residuals
---

<!-- Unnumbered until merge: keep `rfc:` as 0030-ar-test-compare-residual-burndown. -->

# RFC — ActiveRecord test:compare 94→100: residual skip burndown

## Summary

Drives `@blazetrails/activerecord` `test:compare` from **94.3%**
(7806 matched / 7813, **439 matchedSkipped**, snapshot 2026-06-15) to 100%.
This is the successor to **RFC 0016** (`0016-ar-test-compare-100`), which closed
83 of 88 stories and lifted the suite from 88.6% → 94.3% — but its phase spine is
exhausted and most of its stories read as `done` while ~440 mapped tests are
still skipped. The residual skips concentrate in clusters whose 0016 stories were
marked done but only partially scoped (associations W7, insert_all F1,
transactions F4, nested-attributes F6). This RFC re-inventories every counted
skip from live `test:compare` output and owns it with a concrete story.

Refresh before each story: `pnpm test:compare --cached --json --package activerecord`.

## Motivation

`test:compare --package activerecord` (2026-06-15):

```text
rubyFiles 320 · totalRubyTests 7813 · totalMatched 7806
matchedSkipped 439 · wrongDescribe 9 · misplaced 6 · gateMismatch 304
percent 94.3
```

`percent` counts a test as passing unless it is skipped / wrong-describe /
misplaced — **gateMismatch (304) does NOT lower `percent`** (those tests run, just
under a different gate). So the road to 100% is exactly the **439 matchedSkipped +
9 wrongDescribe + 6 misplaced + 7 unmatched**. Gate-mismatch correctness is
tracked separately (see Open questions / RFC 0023).

The 439 counted skips were extracted by joining the comparison file-level
`matchedSkipped` counts with the structured `BLOCKED:` / `ROOT-CAUSE:` / `SCOPE:`
comments carried on each `it.skip` in the TS suite. They bucket into six clusters:

| Cluster                                                               |   Skips | Dominant root cause                                                                 |
| --------------------------------------------------------------------- | ------: | ----------------------------------------------------------------------------------- |
| A. associations / eager-loading                                       |     172 | `associations/*.ts` + `preloader.ts` missing eager/join-model/has-one semantics     |
| D. persistence / transactions / nested-attrs (reopened 0016 clusters) |     100 | committed/destroy callbacks, insert_all upsert, CPK nested-attrs, dirty force-dirty |
| B. relation / scoping                                                 |      60 | `relation/scoping.ts`, default_scope, multi-join aliasing, relation tail            |
| C. schema / migration / defaults                                      |      51 | schema-dumper parity, expression-default dump, migrator residuals                   |
| E. adapter / connection                                               |      32 | DDL-via-`exec()`, standalone/multi-db connection, notifications, EXPLAIN            |
| F. long tail                                                          |      24 | prevent-writes, hot-compat schema cache, lazy-connection query cache                |
| **Total**                                                             | **439** |                                                                                     |

## Design

One story per file or tight feature group, each owning a named subset of the
inventory. Every story embeds its exact list of skipped test names (drawn from
`test:compare` + the TS `it.skip` blocks) so the work is fully enumerated up
front. A story is done when its files report **0 matchedSkipped** (or any residual
is reclassified to the Deferred table with a recorded reason).

Sequencing favours the **unblockers first** (schema-dumper / defaults, which gate
downstream schema-dependent assertions), then the **largest single-file blocks**
(eager_test 59, join_model 35), then everything else in parallel.

### Deferred / permanent-skip

| Category                        | Scope                                   | Action                                                          |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| Phase G — nested error indexing | `associations/nested_error_test.rb` (4) | stays skipped; needs in-memory nested-attribute build (Phase G) |
| Ruby-only types                 | `relation/where_test.rb` Rational (1)   | permanent `it.skip` — no JS equivalent                          |
| YAML / Marshal / thread / fork  | (already excluded from the 439)         | inherited from RFC 0016 `unported-files.ts`                     |

## Rollout

1. **Phase 1 — unblockers:** `c1-schema-dumper-parity`, `c2-defaults-expression-dump`
2. **Phase 2 — association blocks:** `a1`…`a6`
3. **Phase 3 — reopened clusters:** `d1`…`d5`
4. **Phase 4 — relation/scoping + schema tail:** `b1`…`b4`, `c3`, `c4`
5. **Phase 5 — adapter/connection + long tail:** `e1`…`e4`, `f1`
6. **Close-out:** refresh snapshot; confirm `percent` = 100; decommission this RFC's inventory note.

## Alternatives considered

- **Reopen RFC 0016 with a Phase 6.** Rejected: 0016's spine/snapshots are stale and
  its tracking reads as complete; a fresh inventory is clearer and avoids
  re-litigating closed stories.
- **Fold gate-mismatches into this RFC.** Rejected: they don't move `percent`; they
  are a correctness concern better owned by RFC 0023 (surfaced-deviations) / 0012.

## Open questions

1. **Gate-mismatch backlog (304).** Own here as a stretch epic, or hand to RFC 0023?
   Recommendation: 0023 — keep this RFC scoped to the 100% `percent` target.
2. **Untagged counted skips** (default_scoping 16, primary_keys 9, bind_parameter 7,
   transaction_callbacks 7). First task in those stories is a ROOT-CAUSE triage pass
   before implementation; est-loc may grow after triage.

## Stories

The table below is auto-generated from story frontmatter on commit — edit story
files, not this table.

<!-- generated: stories table -->

| ID | Title | Status | Est LOC | Cluster |
| --- | --- | --- | --- | --- |
| [a1-eager-preloader-semantics](stories/a1-eager-preloader-semantics.md) | A1 — eager\_test: preloader eager-loading semantics | draft | 400 | associations |
| [a2-join-model-semantics](stories/a2-join-model-semantics.md) | A2 — join\_model: has\_many :through join-model semantics | draft | 300 | associations |
| [a3-has-one-and-through](stories/a3-has-one-and-through.md) | A3 — has\_one + has\_one\_through residuals | draft | 250 | associations |
| [a4-habtm-join-aliasing](stories/a4-habtm-join-aliasing.md) | A4 — habtm: alias intermediate join table | draft | 120 | associations |
| [a5-cascaded-and-sti-eager](stories/a5-cascaded-and-sti-eager.md) | A5 — cascaded eager + nested-include + full-STI-class | draft | 200 | associations |
| [a6-inverse-and-association-tail](stories/a6-inverse-and-association-tail.md) | A6 — inverse-of + bidirectional + collection tail | draft | 150 | associations |
| [b1-relation-scoping](stories/b1-relation-scoping.md) | B1 — relation\_scoping parity | draft | 200 | clusters |
| [b2-default-scoping](stories/b2-default-scoping.md) | B2 — default\_scoping parity | draft | 200 | clusters |
| [b3-relation-select-joins](stories/b3-relation-select-joins.md) | B3 — relation select + multi-join table aliasing | draft | 150 | clusters |
| [b4-relation-query-tail](stories/b4-relation-query-tail.md) | B4 — relation query tail (with/where\_chain/update\_all/predicate/batches) | draft | 150 | clusters |
| [c1-schema-dumper-parity](stories/c1-schema-dumper-parity.md) | C1 — schema\_dumper parity | draft | 250 | unblockers |
| [c2-defaults-expression-dump](stories/c2-defaults-expression-dump.md) | C2 — defaults: expression-default dump/load | draft | 150 | unblockers |
| [c3-primary-keys](stories/c3-primary-keys.md) | C3 — primary\_keys residuals | draft | 120 | core-residuals |
| [c4-migration-column-def-tail](stories/c4-migration-column-def-tail.md) | C4 — migration + column\_definition + invertible tail | draft | 120 | core-residuals |
| [d1-transactions-commit-destroy-callbacks](stories/d1-transactions-commit-destroy-callbacks.md) | D1 — transactions: committed/destroy callback firing | draft | 250 | clusters |
| [d2-insert-all-on-duplicate](stories/d2-insert-all-on-duplicate.md) | D2 — insert\_all: onDuplicate/upsert non-native semantics | draft | 200 | clusters |
| [d3-nested-attributes-cpk-callbacks](stories/d3-nested-attributes-cpk-callbacks.md) | D3 — nested-attributes: CPK + before\_add callback timing | draft | 250 | clusters |
| [d4-dirty-force-dirty](stories/d4-dirty-force-dirty.md) | D4 — dirty: attribute\_will\_change! force-dirty path | draft | 150 | core-residuals |
| [d5-autosave-locking-residuals](stories/d5-autosave-locking-residuals.md) | D5 — autosave + optimistic-locking-with-includes residuals | draft | 150 | core-residuals |
| [e1-bind-parameter](stories/e1-bind-parameter.md) | E1 — bind\_parameter residuals | draft | 100 | adapter |
| [e2-pg-ddl-via-exec](stories/e2-pg-ddl-via-exec.md) | E2 — PG array/uuid/hstore/virtual-column DDL-via-exec | draft | 120 | adapter |
| [e3-connection-handling](stories/e3-connection-handling.md) | E3 — standalone-connection + multi-db connection handling | draft | 120 | adapter |
| [e4-adapter-explain-notifications](stories/e4-adapter-explain-notifications.md) | E4 — adapter\_test notifications + explain tail | draft | 100 | adapter |
| [f1-prevent-writes-and-tail](stories/f1-prevent-writes-and-tail.md) | F1 — prevent-writes + hot-compat + misc tail | draft | 150 | core-residuals |
| [persistence-query-constraints-save-reload-tests](stories/persistence-query-constraints-save-reload-tests.md) | Port remaining query\_constraints persistence tests (save/reload/update\_attribute/update-parts) from stubs | draft | 80 | — |
| [sqlite3-copy-table-test-port](stories/sqlite3-copy-table-test-port.md) | Port copy\_table\_test.rb to a sqlite3 copy\_table.test.ts convention file (copyTable already implemented) | draft | 150 | — |
| [strict-loading-new-record-gate-in-loaders](stories/strict-loading-new-record-gate-in-loaders.md) | Gate strict-loading violation behind find\_target? new-record check in functional loaders | ready | 80 | — |
| [timestamp-index-created-for-both-timestamps](stories/timestamp-index-created-for-both-timestamps.md) | timestamp: index is created for both timestamps (fixture-dependent) | ready | 30 | — |
| [virtual-reconcile-warm-schema-cache](stories/virtual-reconcile-warm-schema-cache.md) | Memoize schema cache when virtual reconciliation reflects on cold cache | ready | 40 | core-residuals |

## Changelog

- 2026-06-15: adopt the 5 still-open stories from RFC 0016 (persistence-query-constraints-save-reload-tests, sqlite3-copy-table-test-port, strict-loading-new-record-gate-in-loaders, timestamp-index-created-for-both-timestamps, virtual-reconcile-warm-schema-cache); 0016's residual-skip campaign is now superseded by this RFC.
- 2026-06-15: initial RFC; inventory of 439 counted skips migrated from live
  `test:compare` output, successor to 0016-ar-test-compare-100 (94.3%).
