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

Cluster frontmatter slugs are exactly the six in the RFC `clusters:` block, so the
auto-generated Stories table `Cluster` column is informative; the A–F letters above
give the finer grouping (D and F both draw on `core-residuals` for un-tagged tails).

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

## Stories

The table below is auto-generated from story frontmatter on commit — edit story
files, not this table.

<!-- generated: stories table -->

| ID                                                                                                                            | Title                                                                                                     | Status      | Est LOC | Cluster          |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ------- | ---------------- |
| [cascaded-eager-join-emit-alias](stories/cascaded-eager-join-emit-alias.md)                                                   | cascaded-eager-join-emit-alias                                                                            | ready       | null    | —                |
| [collection-proxy-named-scope-relation-cache](stories/collection-proxy-named-scope-relation-cache.md)                         | Cache named-scope relations on association proxy + invalidate on reset                                    | ready       | 120     | —                |
| [compute-type-namespace-relative-resolution](stories/compute-type-namespace-relative-resolution.md)                           | compute-type-namespace-relative-resolution                                                                | ready       | null    | —                |
| [eager-joined-includes-multi-fanout-coverage](stories/eager-joined-includes-multi-fanout-coverage.md)                         | eager_test: regression coverage for multi-include joins∩includes fan-out                                  | ready       | 40      | —                |
| [eager-load-too-many-ids-join-dependency-perf](stories/eager-load-too-many-ids-join-dependency-perf.md)                       | JoinDependency instantiation perf: un-skip eager_load too-many-ids on MySQL-family lanes                  | ready       | 150     | —                |
| [has-one-destroy-callback-inverse-sync-convergence](stories/has-one-destroy-callback-inverse-sync-convergence.md)             | has-one-destroy-callback-inverse-sync-convergence                                                         | ready       | null    | —                |
| [nested-preload-through-has-one-source](stories/nested-preload-through-has-one-source.md)                                     | nested-preload-through-has-one-source                                                                     | ready       | null    | —                |
| [pg-pinned-client-write-query-serialization](stories/pg-pinned-client-write-query-serialization.md)                           | PG pinned-client write-path query serialization                                                           | ready       | null    | —                |
| [sqlite3-columns-thread-generated-type](stories/sqlite3-columns-thread-generated-type.md)                                     | sqlite3-columns-thread-generated-type                                                                     | ready       | null    | —                |
| [sqlite3-json-default-serialization](stories/sqlite3-json-default-serialization.md)                                           | sqlite3-json-default-serialization                                                                        | ready       | null    | —                |
| [sqlite3-string-column-no-default-limit](stories/sqlite3-string-column-no-default-limit.md)                                   | sqlite3-string-column-no-default-limit                                                                    | ready       | null    | —                |
| [thread-connection-through-schema-reflection-reads](stories/thread-connection-through-schema-reflection-reads.md)             | Thread connection through schema-reflection reads; drop the .connection getter bridge                     | ready       | 90      | —                |
| [unskip-has-one-load-displaced-on-replace](stories/unskip-has-one-load-displaced-on-replace.md)                               | unskip-has-one-load-displaced-on-replace                                                                  | ready       | null    | —                |
| [wrap-findbysql-internal-query-entry-points](stories/wrap-findbysql-internal-query-entry-points.md)                           | Wrap findBySql/countBySql (raw-SQL query entry points) in withQueryConnection                             | ready       | 40      | —                |
| [association-scope-result-caching-and-comments-newest](stories/association-scope-result-caching-and-comments-newest.md)       | Association scope-result caching on proxies + Post comments newest extension                              | claimed     | 150     | —                |
| [canonical-company-enable-sti](stories/canonical-company-enable-sti.md)                                                       | canonical-company-enable-sti                                                                              | claimed     | null    | —                |
| [legacy-migration-5-0-create-table-and-chain](stories/legacy-migration-5-0-create-table-and-chain.md)                         | legacy-migration-5-0-create-table-and-chain                                                               | claimed     | null    | —                |
| [cascaded-eager-join-alias-and-callbacks](stories/cascaded-eager-join-alias-and-callbacks.md)                                 | cascaded-eager-join-alias-and-callbacks                                                                   | in-progress | null    | —                |
| [pg-bigserial-createtable-dumper-flip](stories/pg-bigserial-createtable-dumper-flip.md)                                       | Flip PG default PK to BIGSERIAL: createTable + dumper + un-skip                                           | in-progress | 60      | —                |
| [a1-eager-count-multitable-conditional](stories/a1-eager-count-multitable-conditional.md)                                     | A1d — eager_test: count/size with multi-table conditional                                                 | done        | null    | associations     |
| [a1-eager-cpk-preload](stories/a1-eager-cpk-preload.md)                                                                       | A1g — eager_test: preload via composite query_constraints / CPK                                           | done        | null    | associations     |
| [a1-eager-joined-table-conditions-order](stories/a1-eager-joined-table-conditions-order.md)                                   | A1b — eager_test: conditions/order/select/limit on joined tables                                          | done        | null    | associations     |
| [a1-eager-misc-notifications-too-many-ids](stories/a1-eager-misc-notifications-too-many-ids.md)                               | A1i — eager_test: notifications/i18n, too-many-ids, preload SQL, pk has_one                               | done        | null    | associations     |
| [a1-eager-polymorphic-references-existential](stories/a1-eager-polymorphic-references-existential.md)                         | A1f — eager_test: polymorphic custom-type/existential/references                                          | done        | null    | associations     |
| [a1-eager-preloader-semantics](stories/a1-eager-preloader-semantics.md)                                                       | A1 — eager_test: preloader eager-loading semantics                                                        | done        | 470     | associations     |
| [a1-eager-scope-stack-exclusive-scope](stories/a1-eager-scope-stack-exclusive-scope.md)                                       | A1h — eager_test: scope-stack + exclusive/default scope preload                                           | done        | null    | associations     |
| [a1-eager-sti-through](stories/a1-eager-sti-through.md)                                                                       | A1e — eager_test: preload/eager-load through STI join models                                              | done        | null    | associations     |
| [a1-eager-where-references-and-from](stories/a1-eager-where-references-and-from.md)                                           | A1c — eager_test: where/from references association name + implicit references                            | done        | null    | associations     |
| [a3-has-one-and-through](stories/a3-has-one-and-through.md)                                                                   | A3 — has_one + has_one_through residuals                                                                  | done        | 230     | associations     |
| [a4-habtm-join-aliasing](stories/a4-habtm-join-aliasing.md)                                                                   | A4 — habtm: alias intermediate join table                                                                 | done        | 100     | associations     |
| [a5-cascaded-and-sti-eager](stories/a5-cascaded-and-sti-eager.md)                                                             | A5 — cascaded eager + nested-include + full-STI-class                                                     | done        | 140     | associations     |
| [adapter-update-prepared-statement-binds](stories/adapter-update-prepared-statement-binds.md)                                 | Write-path binds round-trip prepared statement (null-byte values)                                         | done        | 80      | adapter          |
| [associations-test-canonical-fixtures-convergence](stories/associations-test-canonical-fixtures-convergence.md)               | Convert associations.test bespoke models to canonical fixtures (subselect/references/limitable)           | done        | 200     | associations     |
| [async-uniqueness-strict-option-test-coverage](stories/async-uniqueness-strict-option-test-coverage.md)                       | Direct test coverage for strict: on async uniqueness validations                                          | done        | 25      | —                |
| [async-validations-honor-validation-context](stories/async-validations-honor-validation-context.md)                           | async-validations-honor-validation-context                                                                | done        | null    | —                |
| [autosave-has-many-save-on-parent](stories/autosave-has-many-save-on-parent.md)                                               | Autosave persists built has_many children on owner save                                                   | done        | 120     | associations     |
| [autosave-uniqueness-rollback-and-error-format](stories/autosave-uniqueness-rollback-and-error-format.md)                     | Un-skip autosave uniqueness-rollback tests (validates uniqueness routing + propagateErrors convergence)   | done        | 120     | —                |
| [b1-relation-scoping](stories/b1-relation-scoping.md)                                                                         | B1 — relation_scoping parity                                                                              | done        | 160     | relation-scoping |
| [b2-counter-cache-column-from-belongsto](stories/b2-counter-cache-column-from-belongsto.md)                                   | counter-cache column derives from belongs_to                                                              | done        | 50      | —                |
| [b2-createwith-merge-precedence](stories/b2-createwith-merge-precedence.md)                                                   | createWith merge precedence (last-wins)                                                                   | done        | 40      | —                |
| [b2-default-scoping](stories/b2-default-scoping.md)                                                                           | B2 — default_scoping parity                                                                               | done        | 130     | relation-scoping |
| [b2-reverse-multicolumn-string-order](stories/b2-reverse-multicolumn-string-order.md)                                         | reverseOrder handles multi-column string order                                                            | done        | 40      | —                |
| [b2-sti-hasmany-preload-foreign-key](stories/b2-sti-hasmany-preload-foreign-key.md)                                           | STI hasMany eager/preload foreign key derivation                                                          | done        | 50      | —                |
| [b2-sti-type-survives-unscope](stories/b2-sti-type-survives-unscope.md)                                                       | STI type predicate survives unscope(where)                                                                | done        | 50      | —                |
| [b2-unscope-leftjoins-alias](stories/b2-unscope-leftjoins-alias.md)                                                           | unscope accepts leftJoins alias                                                                           | done        | 20      | —                |
| [b2-unscope-where-merge-reset](stories/b2-unscope-where-merge-reset.md)                                                       | merge of unscope(where) clears where clause                                                               | done        | 40      | —                |
| [b3-relation-select-joins](stories/b3-relation-select-joins.md)                                                               | B3 — relation select + multi-join table aliasing                                                          | done        | 140     | relation-scoping |
| [b4-relation-query-tail](stories/b4-relation-query-tail.md)                                                                   | B4 — relation query tail (with/where_chain/update_all/predicate/batches)                                  | done        | 70      | relation-scoping |
| [c1-schema-dumper-mysql-gaps](stories/c1-schema-dumper-mysql-gaps.md)                                                         | c1-schema-dumper-mysql-gaps                                                                               | done        | null    | —                |
| [c1-schema-dumper-oid-introspection-limit](stories/c1-schema-dumper-oid-introspection-limit.md)                               | PG oid introspection surfaces spurious limit: 8                                                           | done        | 40      | —                |
| [c1-schema-dumper-parity](stories/c1-schema-dumper-parity.md)                                                                 | C1 — schema_dumper parity                                                                                 | done        | 180     | unblockers       |
| [c1-schema-dumper-pg-decimal-array](stories/c1-schema-dumper-pg-decimal-array.md)                                             | c1-schema-dumper-pg-decimal-array                                                                         | done        | null    | —                |
| [c1-schema-dumper-residual-gaps](stories/c1-schema-dumper-residual-gaps.md)                                                   | c1-schema-dumper-residual-gaps                                                                            | done        | null    | —                |
| [c1-schema-dumper-timestamptz-version-compat](stories/c1-schema-dumper-timestamptz-version-compat.md)                         | c1-schema-dumper-timestamptz-version-compat                                                               | done        | null    | —                |
| [c2-defaults-expression-dump](stories/c2-defaults-expression-dump.md)                                                         | C2 — defaults: expression-default dump/load                                                               | done        | 90      | unblockers       |
| [c2-defaults-mariadb-expression-reflection](stories/c2-defaults-mariadb-expression-reflection.md)                             | MariaDB uuid()/concat() expression-default reflection                                                     | done        | 60      | —                |
| [c2-defaults-nonstrict-null-coercion](stories/c2-defaults-nonstrict-null-coercion.md)                                         | c2-defaults-nonstrict-null-coercion                                                                       | done        | null    | —                |
| [c3-primary-keys](stories/c3-primary-keys.md)                                                                                 | C3 — primary_keys residuals                                                                               | done        | 70      | core-residuals   |
| [c4-migration-column-def-tail](stories/c4-migration-column-def-tail.md)                                                       | C4 — migration + column_definition + invertible tail                                                      | done        | 60      | core-residuals   |
| [canonical-bulb-public-attribute-accessors](stories/canonical-bulb-public-attribute-accessors.md)                             | canonical-bulb-public-attribute-accessors                                                                 | done        | null    | —                |
| [cascaded-eager-nil-and-proxy-preload-convergence](stories/cascaded-eager-nil-and-proxy-preload-convergence.md)               | cascaded-eager-nil-and-proxy-preload-convergence                                                          | done        | null    | —                |
| [cc-id-setter-missing-attribute](stories/cc-id-setter-missing-attribute.md)                                                   | cc-id-setter-missing-attribute                                                                            | done        | null    | —                |
| [cc-schema-dumper-pk-rendering](stories/cc-schema-dumper-pk-rendering.md)                                                     | cc-schema-dumper-pk-rendering                                                                             | done        | null    | —                |
| [change-table-recorder-adapter-column-methods](stories/change-table-recorder-adapter-column-methods.md)                       | change_table recorder proxy surfaces adapter column-type shorthands (t.hstore)                            | done        | 60      | adapter          |
| [collection-proxy-inspect](stories/collection-proxy-inspect.md)                                                               | CollectionProxy#inspect loads target without premature reload                                             | done        | 100     | associations     |
| [columnshash-empty-after-aliased-hash-select](stories/columnshash-empty-after-aliased-hash-select.md)                         | columnshash-empty-after-aliased-hash-select                                                               | done        | null    | —                |
| [converge-cross-model-merge-join-aliasing](stories/converge-cross-model-merge-join-aliasing.md)                               | Converge cross-model merge join aliasing (shared AliasTracker)                                            | done        | 150     | —                |
| [current-savepoint-name-accessor](stories/current-savepoint-name-accessor.md)                                                 | expose current_savepoint_name / Transaction#savepoint_name                                                | done        | 50      | —                |
| [d1-transactions-commit-destroy-callbacks](stories/d1-transactions-commit-destroy-callbacks.md)                               | D1 — transactions: committed/destroy callback firing                                                      | done        | 330     | persistence      |
| [d2-insert-all-canonical-models](stories/d2-insert-all-canonical-models.md)                                                   | insert-all.test.ts: migrate to canonical models + fixtures                                                | done        | 200     | persistence      |
| [d2-insert-all-db-primary-keys-convergence](stories/d2-insert-all-db-primary-keys-convergence.md)                             | d2-insert-all-db-primary-keys-convergence                                                                 | done        | null    | —                |
| [d2-insert-all-on-duplicate](stories/d2-insert-all-on-duplicate.md)                                                           | D2 — insert_all: onDuplicate/upsert non-native semantics                                                  | done        | 330     | persistence      |
| [d2-insert-all-partitioned-indexes](stories/d2-insert-all-partitioned-indexes.md)                                             | insert-all.test.ts: unblock upsert_all partitioned-indexes test (PG)                                      | done        | 120     | —                |
| [d2-insert-all-returning-result](stories/d2-insert-all-returning-result.md)                                                   | insert_all/upsert_all returning → ActiveRecord::Result                                                    | done        | 200     | persistence      |
| [d2-insert-all-unique-index-introspection](stories/d2-insert-all-unique-index-introspection.md)                               | insert_all unique_by schema-cache index introspection                                                     | done        | 250     | persistence      |
| [d3-nested-attributes-cpk-callbacks](stories/d3-nested-attributes-cpk-callbacks.md)                                           | D3 — nested-attributes: CPK + before_add callback timing                                                  | done        | 120     | persistence      |
| [d4-dirty-force-dirty](stories/d4-dirty-force-dirty.md)                                                                       | D4 — dirty: attribute_will_change! force-dirty path                                                       | done        | 80      | core-residuals   |
| [d5-autosave-locking-residuals](stories/d5-autosave-locking-residuals.md)                                                     | D5 — autosave + optimistic-locking-with-includes residuals                                                | done        | 70      | core-residuals   |
| [e2-pg-ddl-via-exec](stories/e2-pg-ddl-via-exec.md)                                                                           | E2 — PG array/uuid/hstore/virtual-column DDL-via-exec                                                     | done        | 70      | adapter          |
| [e3-connection-handling](stories/e3-connection-handling.md)                                                                   | E3 — standalone-connection + multi-db connection handling                                                 | done        | 50      | adapter          |
| [eager-load-extra-select-projection](stories/eager-load-extra-select-projection.md)                                           | eager-load-extra-select-projection                                                                        | done        | null    | —                |
| [eager-load-extra-select-result-type-cast](stories/eager-load-extra-select-result-type-cast.md)                               | eager-load-extra-select-result-type-cast                                                                  | done        | null    | —                |
| [habtm-collection-proxy-find](stories/habtm-collection-proxy-find.md)                                                         | habtm: CollectionProxy include/transaction/preloaded-size                                                 | done        | 120     | associations     |
| [habtm-namespaced-classname](stories/habtm-namespaced-classname.md)                                                           | habtm: namespaced/symbol className resolution                                                             | done        | 100     | associations     |
| [habtm-residual-features](stories/habtm-residual-features.md)                                                                 | habtm: polymorphic-through, alternate-db, belongs_to-required                                             | done        | 150     | associations     |
| [habtm-savepoint-lifecycle](stories/habtm-savepoint-lifecycle.md)                                                             | habtm: assign_ids savepoint lifecycle on PG/MySQL                                                         | done        | 80      | associations     |
| [has-many-current-scope-isolation](stories/has-many-current-scope-isolation.md)                                               | has_many reads ignore class current_scope                                                                 | done        | 70      | relation-scoping |
| [ho-through-source-klass-resolution](stories/ho-through-source-klass-resolution.md)                                           | ho-through-source-klass-resolution                                                                        | done        | null    | —                |
| [hot-compatibility-prepared-statement-cache-expired](stories/hot-compatibility-prepared-statement-cache-expired.md)           | PG prepared-statement-cache-expired cleanup mid-transaction                                               | done        | 120     | adapter          |
| [hot-compatibility-schema-cache-hot-reload-remove-column](stories/hot-compatibility-schema-cache-hot-reload-remove-column.md) | Hot-compatibility insert/update after remove_column (schema-cache hot-reload)                             | done        | 90      | —                |
| [inclusion-validator-string-range](stories/inclusion-validator-string-range.md)                                               | inclusion-validator-string-range                                                                          | done        | null    | —                |
| [insert-all-log-message-model-name](stories/insert-all-log-message-model-name.md)                                             | insert_all/upsert_all log message includes model name (SQL-log capture)                                   | done        | 80      | persistence      |
| [insert-all-multicolumn-unique-by-introspection](stories/insert-all-multicolumn-unique-by-introspection.md)                   | upsert_all multi-column unique_by index introspection                                                     | done        | 120     | persistence      |
| [insert-all-returning-alias-resolution](stories/insert-all-returning-alias-resolution.md)                                     | insert_all RETURNING does not resolve aliased attributes                                                  | done        | 60      | persistence      |
| [insert-all-serialize-array-name-consistency](stories/insert-all-serialize-array-name-consistency.md)                         | insert_all serialize round-trip consistency (RETURNING)                                                   | done        | 40      | persistence      |
| [insert-all-sti-type-injection](stories/insert-all-sti-type-injection.md)                                                     | insert_all resolveSti ignores registerSubclass STI                                                        | done        | 80      | persistence      |
| [insert-all-table-name-with-database-qualify](stories/insert-all-table-name-with-database-qualify.md)                         | insert_all MySQL database-qualified table name under handler suite                                        | done        | 60      | persistence      |
| [insert-all-timestamp-alias-case](stories/insert-all-timestamp-alias-case.md)                                                 | insert_all timestamp-alias resolution is snake_case-only                                                  | done        | 60      | persistence      |
| [inverse-of-single-association-access-convergence](stories/inverse-of-single-association-access-convergence.md)               | Inverse-of wiring on single-association access path (recursive/STI/callbacks/autosave)                    | done        | 200     | associations     |
| [isvalid-does-not-run-uniqueness-validations](stories/isvalid-does-not-run-uniqueness-validations.md)                         | isvalid-does-not-run-uniqueness-validations                                                               | done        | null    | —                |
| [join-model-canonical-conversion](stories/join-model-canonical-conversion.md)                                                 | join-model-canonical-conversion                                                                           | done        | 480     | associations     |
| [left-joins-cross-model-merge](stories/left-joins-cross-model-merge.md)                                                       | left_joins cross-model merge preserves left joins + wheres                                                | done        | 120     | associations     |
| [left-outer-joins-inner-dedup](stories/left-outer-joins-inner-dedup.md)                                                       | left_outer_joins dedupes association shared with inner joins to a single INNER JOIN                       | done        | 100     | —                |
| [legacy-migration-5-0-uuid-default](stories/legacy-migration-5-0-uuid-default.md)                                             | Legacy Migration[5.0] uuid PK default (uuid_generate_v4) via migrator                                     | done        | 200     | adapter          |
| [migration-context-filesystem-loader](stories/migration-context-filesystem-loader.md)                                         | migration-context-filesystem-loader                                                                       | done        | null    | —                |
| [model-loadschema-nil-primary-key-from-introspection](stories/model-loadschema-nil-primary-key-from-introspection.md)         | loadSchema consults adapter.primaryKey so key-less data sources yield nil PK                              | done        | 120     | adapter          |
| [multi-db-polymorphic-preload](stories/multi-db-polymorphic-preload.md)                                                       | Multi-database polymorphic preload with same table name (pool)                                            | done        | 150     | associations     |
| [old-config-first-saved-commit-callbacks](stories/old-config-first-saved-commit-callbacks.md)                                 | old-config first-saved-instance commit callbacks + before_commit order                                    | done        | 90      | —                |
| [persistence-query-constraints-save-reload-tests](stories/persistence-query-constraints-save-reload-tests.md)                 | Port remaining query_constraints persistence tests (save/reload/update_attribute/update-parts) from stubs | done        | 80      | —                |
| [pg-array-oid-element-subtypes](stories/pg-array-oid-element-subtypes.md)                                                     | PG array OID element subtypes: hstore[] / tz-aware datetime[] / timestamp[] precision                     | done        | 180     | adapter          |
| [pg-ddl-exec-exception-translation](stories/pg-ddl-exec-exception-translation.md)                                             | PG DDL exec() path: translate driver errors to StatementInvalid                                           | done        | 120     | adapter          |
| [pg-default-pk-bigserial-cascade](stories/pg-default-pk-bigserial-cascade.md)                                                 | PG default PK → BIGSERIAL cascade (BigInt-id convergence campaign)                                        | done        | null    | —                |
| [pg-record-id-bigint-assertion-sweep](stories/pg-record-id-bigint-assertion-sweep.md)                                         | Sweep PG-lane record.id assertions to tolerate BigInt (pre-BIGSERIAL-flip)                                | done        | 200     | —                |
| [pg-record-id-bigint-sweep-batches](stories/pg-record-id-bigint-sweep-batches.md)                                             | pg-record-id-bigint-sweep-batches                                                                         | done        | null    | —                |
| [pg-record-id-bigint-sweep-habtm](stories/pg-record-id-bigint-sweep-habtm.md)                                                 | pg-record-id-bigint-sweep-habtm                                                                           | done        | null    | —                |
| [pg-record-id-bigint-sweep-join-model](stories/pg-record-id-bigint-sweep-join-model.md)                                       | pg-record-id-bigint-sweep-join-model                                                                      | done        | null    | —                |
| [pg-record-id-bigint-sweep-named-scoping](stories/pg-record-id-bigint-sweep-named-scoping.md)                                 | pg-record-id-bigint-sweep-named-scoping                                                                   | done        | null    | —                |
| [pg-record-id-bigint-sweep-relation-with](stories/pg-record-id-bigint-sweep-relation-with.md)                                 | pg-record-id-bigint-sweep-relation-with                                                                   | done        | null    | —                |
| [pg-record-id-bigint-sweep-relations](stories/pg-record-id-bigint-sweep-relations.md)                                         | pg-record-id-bigint-sweep-relations                                                                       | done        | null    | —                |
| [pg-untyped-pk-int8-deserialization](stories/pg-untyped-pk-int8-deserialization.md)                                           | PG untyped-PK int8 deserialization: resolve implicit PK type on schema-cache miss                         | done        | 120     | —                |
| [pool-eviction-on-transaction-raise](stories/pool-eviction-on-transaction-raise.md)                                           | pool evicts connection on begin/commit/rollback failure                                                   | done        | 90      | —                |
| [port-merge-joins-as-symbols-relation-test](stories/port-merge-joins-as-symbols-relation-test.md)                             | Port relation_test.rb merge-joins-as-symbols family from stubs                                            | done        | 120     | —                |
| [preload-eager-inverse-before-callbacks](stories/preload-eager-inverse-before-callbacks.md)                                   | Wire inverse_of before callbacks on preloader + join-dependency eager paths                               | done        | 180     | —                |
| [preload-extending-grouping](stories/preload-extending-grouping.md)                                                           | Preloader groups same-SQL second-level assocs differing by extending                                      | done        | 120     | associations     |
| [raw-connection-materializes-transactions](stories/raw-connection-materializes-transactions.md)                               | rawConnection materializes txn + disables lazy transactions                                               | done        | 90      | —                |
| [reload-association-cache-through-join-pg-cast](stories/reload-association-cache-through-join-pg-cast.md)                     | Un-skip reload-association-cache (PG through-JOIN type-cast + publication callback fix)                   | done        | 80      | —                |
| [reverse-single-term-balanced-paren-order](stories/reverse-single-term-balanced-paren-order.md)                               | reverse-single-term-balanced-paren-order                                                                  | done        | null    | —                |
| [schema-dumper-emittable-virtual-column-options](stories/schema-dumper-emittable-virtual-column-options.md)                   | SchemaDumper emitTable routes virtual columns through PG prepareColumnOptions                             | done        | 90      | adapter          |
| [schema-dumper-expression-default-pg-sqlite](stories/schema-dumper-expression-default-pg-sqlite.md)                           | Schema dumper reflects PG/SQLite expression-column defaults                                               | done        | 100     | —                |
| [schema-dumper-pg-infinity-float-default](stories/schema-dumper-pg-infinity-float-default.md)                                 | PG float infinity/NaN column default schema dump                                                          | done        | 60      | —                |
| [scoping-all-queries-block](stories/scoping-all-queries-block.md)                                                             | Relation#scoping(all_queries:) block-form parity                                                          | done        | 80      | relation-scoping |
| [scoping-residual-includes-sti-cache](stories/scoping-residual-includes-sti-cache.md)                                         | relation_scoping residuals: includes-scoping, STI find constraint, unscoped cache busting                 | done        | 120     | relation-scoping |
| [sqlite3-copy-table-test-port](stories/sqlite3-copy-table-test-port.md)                                                       | Port copy_table_test.rb to a sqlite3 copy_table.test.ts convention file (copyTable already implemented)   | done        | 150     | —                |
| [store-full-sti-class-name](stories/store-full-sti-class-name.md)                                                             | store-full-sti-class-name                                                                                 | done        | null    | —                |
| [strict-loading-new-record-gate-in-loaders](stories/strict-loading-new-record-gate-in-loaders.md)                             | Gate strict-loading violation behind find_target? new-record check in functional loaders                  | done        | 80      | —                |
| [subselect-full-record-equality-assertion](stories/subselect-full-record-equality-assertion.md)                               | subselect test: assert full-record equality to match Rails assert_equal (not id-only)                     | done        | 20      | —                |
| [thread-yielded-connection-internal-query-path](stories/thread-yielded-connection-internal-query-path.md)                     | thread-yielded-connection-internal-query-path                                                             | done        | null    | —                |
| [timestamp-index-created-for-both-timestamps](stories/timestamp-index-created-for-both-timestamps.md)                         | timestamp: index is created for both timestamps (fixture-dependent)                                       | done        | 30      | —                |
| [touch-transactional-callbacks](stories/touch-transactional-callbacks.md)                                                     | touch enrolls in transactional commit/rollback callbacks                                                  | done        | 120     | —                |
| [transaction-option-validation-and-ddl](stories/transaction-option-validation-and-ddl.md)                                     | transaction() option-key validation + DDL-in-transaction                                                  | done        | 80      | —                |
| [unskip-dirty-tracking](stories/unskip-dirty-tracking.md)                                                                     | Un-skip dirty_test (10 skipped)                                                                           | done        | 120     | —                |
| [unskip-has-one-associations](stories/unskip-has-one-associations.md)                                                         | Un-skip has_one_associations_test (41 skipped)                                                            | done        | 200     | —                |
| [unskip-named-scoping-misc-model-scopes](stories/unskip-named-scoping-misc-model-scopes.md)                                   | Un-skip named-scoping misc model scopes (last-cache, newest, oops, without_table)                         | done        | 200     | core-residuals   |
| [unskip-named-scoping-query-cache-on-associations](stories/unskip-named-scoping-query-cache-on-associations.md)               | Un-skip named-scoping query-cache-on-associations cases                                                   | done        | 150     | core-residuals   |
| [unskip-named-scoping-scope-definition-guards](stories/unskip-named-scoping-scope-definition-guards.md)                       | Un-skip named-scoping scope-definition guards (callable + reserved/relation names)                        | done        | 150     | core-residuals   |
| [unskip-named-scoping-scoping-block-and-stats-scopes](stories/unskip-named-scoping-scoping-block-and-stats-scopes.md)         | Un-skip named-scoping scoping-block + stats/current-scope scopes                                          | done        | 250     | core-residuals   |
| [update-delete-all-default-scope-joins](stories/update-delete-all-default-scope-joins.md)                                     | update_all/delete_all preserve default-scope JOIN via subquery                                            | done        | 90      | relation-scoping |
| [virtual-reconcile-warm-schema-cache](stories/virtual-reconcile-warm-schema-cache.md)                                         | Memoize schema cache when virtual reconciliation reflects on cold cache                                   | done        | 40      | core-residuals   |
| [where-hash-keys-resolve-to-join-alias](stories/where-hash-keys-resolve-to-join-alias.md)                                     | where-hash-keys-resolve-to-join-alias                                                                     | done        | null    | —                |
| [with-connection-query-path](stories/with-connection-query-path.md)                                                           | with-connection-query-path                                                                                | done        | null    | —                |
| [a1-eager-string-and-scoped-joins](stories/a1-eager-string-and-scoped-joins.md)                                               | A1a — eager_test: string/scoped/same-table/intersection joins                                             | blocked     | null    | associations     |
| [a2-join-model-semantics](stories/a2-join-model-semantics.md)                                                                 | A2 — join_model: has_many :through join-model semantics                                                   | blocked     | 280     | associations     |
| [a2-join-model-semantics-residual](stories/a2-join-model-semantics-residual.md)                                               | a2-join-model-semantics-residual                                                                          | blocked     | null    | —                |
| [a6-inverse-and-association-tail](stories/a6-inverse-and-association-tail.md)                                                 | A6 — inverse-of + bidirectional + collection tail                                                         | blocked     | 140     | associations     |
| [c1-schema-dumper-migration-version-compat](stories/c1-schema-dumper-migration-version-compat.md)                             | c1-schema-dumper-migration-version-compat                                                                 | blocked     | null    | —                |
| [cc-pg-default-pk-bigserial](stories/cc-pg-default-pk-bigserial.md)                                                           | cc-pg-default-pk-bigserial                                                                                | blocked     | null    | —                |
| [e1-bind-parameter](stories/e1-bind-parameter.md)                                                                             | E1 — bind_parameter residuals                                                                             | blocked     | 60      | adapter          |
| [e4-adapter-explain-notifications](stories/e4-adapter-explain-notifications.md)                                               | E4 — adapter_test notifications + explain tail                                                            | blocked     | 50      | adapter          |
| [f1-prevent-writes-and-tail](stories/f1-prevent-writes-and-tail.md)                                                           | F1 — prevent-writes + hot-compat + misc tail                                                              | blocked     | 140     | core-residuals   |
| [write-path-bind-all-column-types](stories/write-path-bind-all-column-types.md)                                               | write-path-bind-all-column-types                                                                          | blocked     | null    | —                |

## Changelog

- 2026-06-16: gate this RFC behind RFC 0019 (reopened) for grandfathered files. Added the "Gating: blocked behind RFC 0019" section and the strict `defineSchema`-canonical-only rule; tightened the per-story test-writing direction to require the file's 0019 canonical conversion (and its removal from `require-canonical-schema-exclude.json`) before un-skipping. Blocked the not-yet-live association stories (a6, a2-residual, a1-string-and-scoped-joins) behind their 0019 conversion; the live a1–a5 agents are redirected to fold the conversion in.
- 2026-06-15: adopt the 5 still-open stories from RFC 0016 (persistence-query-constraints-save-reload-tests, sqlite3-copy-table-test-port, strict-loading-new-record-gate-in-loaders, timestamp-index-created-for-both-timestamps, virtual-reconcile-warm-schema-cache); 0016's residual-skip campaign is now superseded by this RFC.
- 2026-06-15: initial RFC; inventory of 439 counted skips migrated from live
  `test:compare` output, successor to 0016-ar-test-compare-100 (94.3%).
