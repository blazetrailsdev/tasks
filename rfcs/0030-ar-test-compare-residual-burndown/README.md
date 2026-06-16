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
- **Use `useHandlerFixtures`** for fixture-backed setup (mirrors Rails'
  `fixtures :name` + transactional tests). Look up the real fixtures Rails uses.
- **Move away from `defineSchema`** / bespoke per-test schemas. A perceived gap in
  the canonical schema is a signal to mirror Rails' own setup, not to hand-roll one.
- **Skip rather than deviate.** If a test cannot pass without diverging from Rails
  (an implementation gap or genuine divergence), do **not** contort the test,
  schema, or assertion to force it green. Leave it `it.skip` with a
  `BLOCKED:`/`ROOT-CAUSE:` tag and **file an upstream-fix story** via
  `pnpm tasks new <rfc-slug> <story-slug>`. Always converge to Rails — never
  ratify a deviation.

PR [#3405](https://github.com/blazetrailsdev/trails/pull/3405) is the
**anti-pattern** to avoid: it stood up bespoke/custom-named tables and per-test
schemas instead of riding the canonical schema + fixtures. Don't do that.

### Deferred / permanent-skip

| Category                        | Scope                                   | Action                                                          |
| ------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| Phase G — nested error indexing | `associations/nested_error_test.rb` (4) | stays skipped; needs in-memory nested-attribute build (Phase G) |
| Ruby-only types                 | `relation/where_test.rb` Rational (1)   | permanent `it.skip` — no JS equivalent                          |
| YAML / Marshal / thread / fork  | (already excluded from the 439)         | inherited from RFC 0016 `unported-files.ts`                     |
| Schema dumper PK rendering      | `primary_keys_test.rb` (5)              | stays skipped; tracked by `cc-schema-dumper-pk-rendering`       |
| `id=` MissingAttributeError     | `primary_keys_test.rb` (1)              | stays skipped; tracked by `cc-id-setter-missing-attribute`      |

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

| ID                                                                                                              | Title                                                                                                     | Status      | Est LOC | Cluster          |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | ------- | ---------------- |
| [a1-eager-count-multitable-conditional](stories/a1-eager-count-multitable-conditional.md)                       | A1d — eager_test: count/size with multi-table conditional                                                 | draft       | null    | associations     |
| [a1-eager-cpk-preload](stories/a1-eager-cpk-preload.md)                                                         | A1g — eager_test: preload via composite query_constraints / CPK                                           | draft       | null    | associations     |
| [a1-eager-joined-table-conditions-order](stories/a1-eager-joined-table-conditions-order.md)                     | A1b — eager_test: conditions/order/select/limit on joined tables                                          | draft       | null    | associations     |
| [a1-eager-misc-notifications-too-many-ids](stories/a1-eager-misc-notifications-too-many-ids.md)                 | A1i — eager_test: notifications/i18n, too-many-ids, preload SQL, pk has_one                               | draft       | null    | associations     |
| [a1-eager-polymorphic-references-existential](stories/a1-eager-polymorphic-references-existential.md)           | A1f — eager_test: polymorphic custom-type/existential/references                                          | draft       | null    | associations     |
| [a1-eager-scope-stack-exclusive-scope](stories/a1-eager-scope-stack-exclusive-scope.md)                         | A1h — eager_test: scope-stack + exclusive/default scope preload                                           | draft       | null    | associations     |
| [a1-eager-sti-through](stories/a1-eager-sti-through.md)                                                         | A1e — eager_test: preload/eager-load through STI join models                                              | draft       | null    | associations     |
| [a1-eager-string-and-scoped-joins](stories/a1-eager-string-and-scoped-joins.md)                                 | A1a — eager_test: string/scoped/same-table/intersection joins                                             | draft       | null    | associations     |
| [a1-eager-where-references-and-from](stories/a1-eager-where-references-and-from.md)                             | A1c — eager_test: where/from references association name + implicit references                            | draft       | null    | associations     |
| [canonical-bulb-public-attribute-accessors](stories/canonical-bulb-public-attribute-accessors.md)               | canonical-bulb-public-attribute-accessors                                                                 | draft       | null    | —                |
| [cascaded-eager-join-alias-and-callbacks](stories/cascaded-eager-join-alias-and-callbacks.md)                   | cascaded-eager-join-alias-and-callbacks                                                                   | draft       | null    | —                |
| [habtm-collection-proxy-find](stories/habtm-collection-proxy-find.md)                                           | habtm: CollectionProxy include/transaction/preloaded-size                                                 | draft       | 120     | associations     |
| [habtm-namespaced-classname](stories/habtm-namespaced-classname.md)                                             | habtm: namespaced/symbol className resolution                                                             | draft       | 100     | associations     |
| [habtm-residual-features](stories/habtm-residual-features.md)                                                   | habtm: polymorphic-through, alternate-db, belongs_to-required                                             | draft       | 150     | associations     |
| [habtm-savepoint-lifecycle](stories/habtm-savepoint-lifecycle.md)                                               | habtm: assign_ids savepoint lifecycle on PG/MySQL                                                         | draft       | 80      | associations     |
| [ho-through-source-klass-resolution](stories/ho-through-source-klass-resolution.md)                             | ho-through-source-klass-resolution                                                                        | draft       | null    | —                |
| [join-model-canonical-conversion](stories/join-model-canonical-conversion.md)                                   | join-model-canonical-conversion                                                                           | draft       | 480     | associations     |
| [store-full-sti-class-name](stories/store-full-sti-class-name.md)                                               | store-full-sti-class-name                                                                                 | draft       | null    | —                |
| [columnshash-empty-after-aliased-hash-select](stories/columnshash-empty-after-aliased-hash-select.md)           | columnshash-empty-after-aliased-hash-select                                                               | ready       | null    | —                |
| [d1-transactions-commit-destroy-callbacks](stories/d1-transactions-commit-destroy-callbacks.md)                 | D1 — transactions: committed/destroy callback firing                                                      | ready       | 330     | persistence      |
| [d2-insert-all-on-duplicate](stories/d2-insert-all-on-duplicate.md)                                             | D2 — insert_all: onDuplicate/upsert non-native semantics                                                  | ready       | 330     | persistence      |
| [d3-nested-attributes-cpk-callbacks](stories/d3-nested-attributes-cpk-callbacks.md)                             | D3 — nested-attributes: CPK + before_add callback timing                                                  | ready       | 120     | persistence      |
| [d4-dirty-force-dirty](stories/d4-dirty-force-dirty.md)                                                         | D4 — dirty: attribute_will_change! force-dirty path                                                       | ready       | 80      | core-residuals   |
| [d5-autosave-locking-residuals](stories/d5-autosave-locking-residuals.md)                                       | D5 — autosave + optimistic-locking-with-includes residuals                                                | ready       | 70      | core-residuals   |
| [e1-bind-parameter](stories/e1-bind-parameter.md)                                                               | E1 — bind_parameter residuals                                                                             | ready       | 60      | adapter          |
| [e2-pg-ddl-via-exec](stories/e2-pg-ddl-via-exec.md)                                                             | E2 — PG array/uuid/hstore/virtual-column DDL-via-exec                                                     | ready       | 70      | adapter          |
| [e3-connection-handling](stories/e3-connection-handling.md)                                                     | E3 — standalone-connection + multi-db connection handling                                                 | ready       | 50      | adapter          |
| [e4-adapter-explain-notifications](stories/e4-adapter-explain-notifications.md)                                 | E4 — adapter_test notifications + explain tail                                                            | ready       | 50      | adapter          |
| [eager-load-extra-select-projection](stories/eager-load-extra-select-projection.md)                             | eager-load-extra-select-projection                                                                        | ready       | null    | —                |
| [f1-prevent-writes-and-tail](stories/f1-prevent-writes-and-tail.md)                                             | F1 — prevent-writes + hot-compat + misc tail                                                              | ready       | 140     | core-residuals   |
| [has-many-current-scope-isolation](stories/has-many-current-scope-isolation.md)                                 | has_many reads ignore class current_scope                                                                 | ready       | 70      | relation-scoping |
| [inclusion-validator-string-range](stories/inclusion-validator-string-range.md)                                 | inclusion-validator-string-range                                                                          | ready       | null    | —                |
| [inverse-of-single-association-access-convergence](stories/inverse-of-single-association-access-convergence.md) | Inverse-of wiring on single-association access path (recursive/STI/callbacks/autosave)                    | ready       | 200     | associations     |
| [left-joins-cross-model-merge](stories/left-joins-cross-model-merge.md)                                         | left_joins cross-model merge preserves left joins + wheres                                                | ready       | 120     | associations     |
| [migration-context-filesystem-loader](stories/migration-context-filesystem-loader.md)                           | migration-context-filesystem-loader                                                                       | ready       | null    | —                |
| [multi-db-polymorphic-preload](stories/multi-db-polymorphic-preload.md)                                         | Multi-database polymorphic preload with same table name (pool)                                            | ready       | 150     | associations     |
| [persistence-query-constraints-save-reload-tests](stories/persistence-query-constraints-save-reload-tests.md)   | Port remaining query_constraints persistence tests (save/reload/update_attribute/update-parts) from stubs | ready       | 80      | —                |
| [preload-extending-grouping](stories/preload-extending-grouping.md)                                             | Preloader groups same-SQL second-level assocs differing by extending                                      | ready       | 120     | associations     |
| [reverse-single-term-balanced-paren-order](stories/reverse-single-term-balanced-paren-order.md)                 | reverse-single-term-balanced-paren-order                                                                  | ready       | null    | —                |
| [scoping-all-queries-block](stories/scoping-all-queries-block.md)                                               | Relation#scoping(all_queries:) block-form parity                                                          | ready       | 80      | relation-scoping |
| [scoping-residual-includes-sti-cache](stories/scoping-residual-includes-sti-cache.md)                           | relation_scoping residuals: includes-scoping, STI find constraint, unscoped cache busting                 | ready       | 120     | relation-scoping |
| [sqlite3-copy-table-test-port](stories/sqlite3-copy-table-test-port.md)                                         | Port copy_table_test.rb to a sqlite3 copy_table.test.ts convention file (copyTable already implemented)   | ready       | 150     | —                |
| [strict-loading-new-record-gate-in-loaders](stories/strict-loading-new-record-gate-in-loaders.md)               | Gate strict-loading violation behind find_target? new-record check in functional loaders                  | ready       | 80      | —                |
| [subselect-full-record-equality-assertion](stories/subselect-full-record-equality-assertion.md)                 | subselect test: assert full-record equality to match Rails assert_equal (not id-only)                     | ready       | 20      | —                |
| [timestamp-index-created-for-both-timestamps](stories/timestamp-index-created-for-both-timestamps.md)           | timestamp: index is created for both timestamps (fixture-dependent)                                       | ready       | 30      | —                |
| [update-delete-all-default-scope-joins](stories/update-delete-all-default-scope-joins.md)                       | update_all/delete_all preserve default-scope JOIN via subquery                                            | ready       | 90      | relation-scoping |
| [virtual-reconcile-warm-schema-cache](stories/virtual-reconcile-warm-schema-cache.md)                           | Memoize schema cache when virtual reconciliation reflects on cold cache                                   | ready       | 40      | core-residuals   |
| [where-hash-keys-resolve-to-join-alias](stories/where-hash-keys-resolve-to-join-alias.md)                       | where-hash-keys-resolve-to-join-alias                                                                     | ready       | null    | —                |
| [c1-schema-dumper-oid-introspection-limit](stories/c1-schema-dumper-oid-introspection-limit.md)                 | PG oid introspection surfaces spurious limit: 8                                                           | claimed     | 40      | —                |
| [cc-pg-default-pk-bigserial](stories/cc-pg-default-pk-bigserial.md)                                             | cc-pg-default-pk-bigserial                                                                                | claimed     | null    | —                |
| [c1-schema-dumper-parity](stories/c1-schema-dumper-parity.md)                                                   | C1 — schema_dumper parity                                                                                 | in-progress | 180     | unblockers       |
| [c1-schema-dumper-timestamptz-version-compat](stories/c1-schema-dumper-timestamptz-version-compat.md)           | c1-schema-dumper-timestamptz-version-compat                                                               | in-progress | null    | —                |
| [c2-defaults-mariadb-expression-reflection](stories/c2-defaults-mariadb-expression-reflection.md)               | MariaDB uuid()/concat() expression-default reflection                                                     | in-progress | 60      | —                |
| [cc-schema-dumper-pk-rendering](stories/cc-schema-dumper-pk-rendering.md)                                       | cc-schema-dumper-pk-rendering                                                                             | in-progress | null    | —                |
| [collection-proxy-inspect](stories/collection-proxy-inspect.md)                                                 | CollectionProxy#inspect loads target without premature reload                                             | in-progress | 100     | associations     |
| [a1-eager-preloader-semantics](stories/a1-eager-preloader-semantics.md)                                         | A1 — eager_test: preloader eager-loading semantics                                                        | done        | 470     | associations     |
| [a3-has-one-and-through](stories/a3-has-one-and-through.md)                                                     | A3 — has_one + has_one_through residuals                                                                  | done        | 230     | associations     |
| [a4-habtm-join-aliasing](stories/a4-habtm-join-aliasing.md)                                                     | A4 — habtm: alias intermediate join table                                                                 | done        | 100     | associations     |
| [a5-cascaded-and-sti-eager](stories/a5-cascaded-and-sti-eager.md)                                               | A5 — cascaded eager + nested-include + full-STI-class                                                     | done        | 140     | associations     |
| [a6-inverse-and-association-tail](stories/a6-inverse-and-association-tail.md)                                   | A6 — inverse-of + bidirectional + collection tail                                                         | done        | 140     | associations     |
| [associations-test-canonical-fixtures-convergence](stories/associations-test-canonical-fixtures-convergence.md) | Convert associations.test bespoke models to canonical fixtures (subselect/references/limitable)           | done        | 200     | associations     |
| [autosave-has-many-save-on-parent](stories/autosave-has-many-save-on-parent.md)                                 | Autosave persists built has_many children on owner save                                                   | done        | 120     | associations     |
| [b1-relation-scoping](stories/b1-relation-scoping.md)                                                           | B1 — relation_scoping parity                                                                              | done        | 160     | relation-scoping |
| [b2-counter-cache-column-from-belongsto](stories/b2-counter-cache-column-from-belongsto.md)                     | counter-cache column derives from belongs_to                                                              | done        | 50      | —                |
| [b2-createwith-merge-precedence](stories/b2-createwith-merge-precedence.md)                                     | createWith merge precedence (last-wins)                                                                   | done        | 40      | —                |
| [b2-default-scoping](stories/b2-default-scoping.md)                                                             | B2 — default_scoping parity                                                                               | done        | 130     | relation-scoping |
| [b2-reverse-multicolumn-string-order](stories/b2-reverse-multicolumn-string-order.md)                           | reverseOrder handles multi-column string order                                                            | done        | 40      | —                |
| [b2-sti-hasmany-preload-foreign-key](stories/b2-sti-hasmany-preload-foreign-key.md)                             | STI hasMany eager/preload foreign key derivation                                                          | done        | 50      | —                |
| [b2-sti-type-survives-unscope](stories/b2-sti-type-survives-unscope.md)                                         | STI type predicate survives unscope(where)                                                                | done        | 50      | —                |
| [b2-unscope-leftjoins-alias](stories/b2-unscope-leftjoins-alias.md)                                             | unscope accepts leftJoins alias                                                                           | done        | 20      | —                |
| [b2-unscope-where-merge-reset](stories/b2-unscope-where-merge-reset.md)                                         | merge of unscope(where) clears where clause                                                               | done        | 40      | —                |
| [b3-relation-select-joins](stories/b3-relation-select-joins.md)                                                 | B3 — relation select + multi-join table aliasing                                                          | done        | 140     | relation-scoping |
| [b4-relation-query-tail](stories/b4-relation-query-tail.md)                                                     | B4 — relation query tail (with/where_chain/update_all/predicate/batches)                                  | done        | 70      | relation-scoping |
| [c1-schema-dumper-mysql-gaps](stories/c1-schema-dumper-mysql-gaps.md)                                           | c1-schema-dumper-mysql-gaps                                                                               | done        | null    | —                |
| [c1-schema-dumper-pg-decimal-array](stories/c1-schema-dumper-pg-decimal-array.md)                               | c1-schema-dumper-pg-decimal-array                                                                         | done        | null    | —                |
| [c1-schema-dumper-residual-gaps](stories/c1-schema-dumper-residual-gaps.md)                                     | c1-schema-dumper-residual-gaps                                                                            | done        | null    | —                |
| [c2-defaults-expression-dump](stories/c2-defaults-expression-dump.md)                                           | C2 — defaults: expression-default dump/load                                                               | done        | 90      | unblockers       |
| [c2-defaults-nonstrict-null-coercion](stories/c2-defaults-nonstrict-null-coercion.md)                           | c2-defaults-nonstrict-null-coercion                                                                       | done        | null    | —                |
| [c3-primary-keys](stories/c3-primary-keys.md)                                                                   | C3 — primary_keys residuals                                                                               | done        | 70      | core-residuals   |
| [c4-migration-column-def-tail](stories/c4-migration-column-def-tail.md)                                         | C4 — migration + column_definition + invertible tail                                                      | done        | 60      | core-residuals   |
| [cc-id-setter-missing-attribute](stories/cc-id-setter-missing-attribute.md)                                     | cc-id-setter-missing-attribute                                                                            | done        | null    | —                |
| [a2-join-model-semantics](stories/a2-join-model-semantics.md)                                                   | A2 — join_model: has_many :through join-model semantics                                                   | blocked     | 280     | associations     |
| [a2-join-model-semantics-residual](stories/a2-join-model-semantics-residual.md)                                 | a2-join-model-semantics-residual                                                                          | blocked     | null    | —                |
| [c1-schema-dumper-migration-version-compat](stories/c1-schema-dumper-migration-version-compat.md)               | c1-schema-dumper-migration-version-compat                                                                 | blocked     | null    | —                |

## Changelog

- 2026-06-15: adopt the 5 still-open stories from RFC 0016 (persistence-query-constraints-save-reload-tests, sqlite3-copy-table-test-port, strict-loading-new-record-gate-in-loaders, timestamp-index-created-for-both-timestamps, virtual-reconcile-warm-schema-cache); 0016's residual-skip campaign is now superseded by this RFC.
- 2026-06-15: initial RFC; inventory of 439 counted skips migrated from live
  `test:compare` output, successor to 0016-ar-test-compare-100 (94.3%).
