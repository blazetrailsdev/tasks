---
rfc: "0030-ar-test-compare-residual-burndown"
title: "ActiveRecord test:compare 94→100: residual skip burndown"
status: active
created: 2026-06-15
updated: 2026-06-15
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - associations
  - persistence
  - relation-scoping
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

The work was extracted by joining the comparison file-level `matchedSkipped`
counts with the structured `BLOCKED:` / `ROOT-CAUSE:` / `SCOPE:` comments carried
on each `it.skip` in the TS suite. Two figures are tracked separately:

- **439 `matchedSkipped`** — the comparison metric; what `percent` must drive to 0.
- **444 `it.skip` un-skip targets** — the actual `it.skip` declarations the stories
  enumerate, after **deduping** repeated names and **excluding 21 permanent-skips**
  (Marshal / YAML / thread / fork / Rational). This is the per-story acceptance unit.

The two differ because they are measured differently (ruby-mapped skip vs. TS
`it.skip` AST): a few counted skips are gated via `describeIf*`/`skipIf` rather
than `it.skip` (flagged per-file in the stories), and dedupe/permanent exclusion
nets out close. Each story states both counts. The six clusters, with the
**un-skip targets** each owns (summing to 444):

| Cluster (frontmatter slug)                                                      | Un-skip targets | Stories | Dominant root cause                                                                 |
| ------------------------------------------------------------------------------- | --------------: | ------- | ----------------------------------------------------------------------------------- |
| A. associations / eager-loading (`associations`)                                |             172 | a1–a6   | `associations/*.ts` + `preloader.ts` missing eager/join-model/has-one semantics     |
| D. persistence / transactions / nested-attrs (`persistence` + `core-residuals`) |             116 | d1–d5   | committed/destroy callbacks, insert_all upsert, CPK nested-attrs, dirty force-dirty |
| B. relation / scoping (`relation-scoping`)                                      |              62 | b1–b4   | `relation/scoping.ts`, default_scope, multi-join aliasing, relation tail            |
| C. schema / migration / defaults (`unblockers` + `core-residuals`)              |              49 | c1–c4   | schema-dumper parity, expression-default dump, migrator residuals                   |
| E. adapter / connection (`adapter`)                                             |              28 | e1–e4   | DDL-via-`exec()`, standalone/multi-db connection, notifications, EXPLAIN            |
| F. long tail (`core-residuals`)                                                 |              17 | f1      | prevent-writes, hot-compat schema cache, lazy-connection query cache                |
| **Total**                                                                       |         **444** | 24      |                                                                                     |

Cluster frontmatter slugs are exactly the six in the RFC `clusters:` block, so each
story's `cluster` is informative; the A–F letters above give the finer grouping
(D and F both draw on `core-residuals` for un-tagged tails).

## Design

One story per file or tight feature group, each owning a named subset of the
inventory. Every story embeds its exact list of skipped test names (drawn from
`test:compare` + the TS `it.skip` blocks) so the work is fully enumerated up
front. A story is done when its files report **0 matchedSkipped** (or any residual
is reclassified to the Deferred table with a recorded reason).

Sequencing favours the **unblockers first** (schema-dumper / defaults, which gate
downstream schema-dependent assertions), then the **largest single-file blocks**
(eager_test 59, join_model 35), then everything else in parallel.

### Test-writing direction (applies to every story)

Un-skipping is **not** "make the test green"; it is "make the port faithful to
Rails." Fidelity to the upstream suite is the #1 priority. For every story:

- **Read the corresponding Rails test first** (`activerecord/test/cases/...`) and
  mirror its structure, models, and assertions. Never reword or rename a test.
- **Use the official/canonical schema** (`TEST_SCHEMA`, mirroring Rails'
  `schema.rb`) and the **official canonical models** in
  `packages/activerecord/src/test-helpers/models/` (~200 already ported — Author,
  Post, Tag, Tagging, Comment, Category, Categorization, and many more, matching
  Rails' `activerecord/test/models/`). **Do not create your own custom tables or
  models: table, column, and model names must match Rails exactly.** If Rails uses
  `Author`/`authors`, use the canonical model — never rename it or substitute a
  bespoke one.
- **Use `useHandlerFixtures` / `setupHandlerSuite`** for fixture-backed setup on
  the default canonical tables (mirrors Rails' `fixtures :name` + transactional
  tests). Look up the real fixtures Rails uses. Prefer this over `defineSchema`.
- **`defineSchema` is canonical-only.** It may pass **only** the canonical
  `TEST_SCHEMA` — enforced by the `blazetrails/require-canonical-schema` ESLint
  rule. Never hand-roll a bespoke per-test schema or free table name anywhere.
- **Skip rather than deviate.** If a test cannot pass without diverging from Rails
  (an implementation gap or genuine divergence), do **not** contort the test,
  schema, or assertion to force it green. Leave it `it.skip` with a
  `BLOCKED:`/`ROOT-CAUSE:` tag and **file an upstream-fix story** via
  `pnpm tasks new <rfc-slug> <story-slug>`. Always converge to Rails — never
  ratify a deviation.

PR [#3405](https://github.com/blazetrailsdev/trails/pull/3405) is the
**anti-pattern** to avoid: it stood up bespoke/custom-named tables and per-test
schemas instead of riding the canonical schema + fixtures. Don't do that.

### Gating: blocked behind RFC 0019 for grandfathered files

**This RFC is gated behind [RFC 0019](../0019-canonical-schema-burndown/) for any
file that is still on `eslint/require-canonical-schema-exclude.json`.** That
exclude list grandfathers ~91 legacy files where the canonical-schema lint is
turned OFF — so un-skipping tests in them does **not** trip the lint, and an agent
can pile new tests onto bespoke `defineSchema`. That is exactly the future
cleanup we are avoiding.

Rule: **a 0030 un-skip story whose target file is grandfathered must wait for that
file's RFC 0019 canonical conversion to land first.** The 0019 conversion converts
the file to `TEST_SCHEMA` + canonical models/fixtures **and removes the file from
the exclude list**; only then does the 0030 un-skip ride the clean file. Large
files (eager.test.ts, join_model.test.ts, transactions.test.ts, …) convert over
**multiple ≤500-LOC PRs** — the exclude entry is removed in the **final** PR that
makes the file fully canonical.

Before claiming a 0030 story, grep the exclude list for your target file. If it is
listed, the story is `blocked` (or should be) until 0019 clears it. The
association front (a1–a6) is already blocked/redirected accordingly.

### Deferred / permanent-skip

| Category                         | Scope                                            | Action                                                                          |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Phase G — nested error indexing  | `associations/nested_error_test.rb` (4)          | stays skipped; needs in-memory nested-attribute build (Phase G)                 |
| Ruby-only types                  | `relation/where_test.rb` Rational (1)            | permanent `it.skip` — no JS equivalent                                          |
| YAML / Marshal / thread / fork   | (already excluded from the 439)                  | inherited from RFC 0016 `unported-files.ts`                                     |
| Schema dumper PK rendering       | `primary_keys_test.rb` (5)                       | stays skipped; tracked by `cc-schema-dumper-pk-rendering`                       |
| `id=` MissingAttributeError      | `primary_keys_test.rb` (1)                       | stays skipped; tracked by `cc-id-setter-missing-attribute`                      |
| PG DDL exec exception xlate      | `adapters/postgresql/array_test.rb` (1)          | stays skipped; tracked by `pg-ddl-exec-exception-translation`                   |
| PG array OID element subtypes    | `adapters/postgresql/array_test.rb` (3)          | stays skipped; tracked by `pg-array-oid-element-subtypes`                       |
| Legacy Migration[5.0] uuid       | `adapters/postgresql/uuid_test.rb` (2)           | stays skipped; tracked by `legacy-migration-5-0-uuid-default`                   |
| change_table recorder shorthands | `adapters/postgresql/hstore_test.rb` (1)         | stays skipped; tracked by `change-table-recorder-adapter-column-methods`        |
| Schema dumper virtual columns    | `adapters/postgresql/virtual_column_test.rb` (1) | stays skipped; tracked by `schema-dumper-emittable-virtual-column-options`      |
| Key-less data source nil PK      | `adapters/postgresql/foreign_table_test.rb` (1)  | stays skipped; tracked by `model-loadschema-nil-primary-key-from-introspection` |

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

## Changelog

- 2026-06-16: gate this RFC behind RFC 0019 (reopened) for grandfathered files. Added the "Gating: blocked behind RFC 0019" section and the strict `defineSchema`-canonical-only rule; tightened the per-story test-writing direction to require the file's 0019 canonical conversion (and its removal from `require-canonical-schema-exclude.json`) before un-skipping. Blocked the not-yet-live association stories (a6, a2-residual, a1-string-and-scoped-joins) behind their 0019 conversion; the live a1–a5 agents are redirected to fold the conversion in.
- 2026-06-15: adopt the 5 still-open stories from RFC 0016 (persistence-query-constraints-save-reload-tests, sqlite3-copy-table-test-port, strict-loading-new-record-gate-in-loaders, timestamp-index-created-for-both-timestamps, virtual-reconcile-warm-schema-cache); 0016's residual-skip campaign is now superseded by this RFC.
- 2026-06-15: initial RFC; inventory of 439 counted skips migrated from live
  `test:compare` output, successor to 0016-ar-test-compare-100 (94.3%).
