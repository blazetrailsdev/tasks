---
rfc: "0175-activerecord-test-parity-100"
title: "activerecord tests, assertions, fixtures and schema at 100%"
status: active
created: 2026-09-30
updated: 2026-09-30
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - closeout
  - extra-tests
  - lint-registers
  - missing-tests
  - schema-fixtures
  - skipped-tests
  - unported-tests
related-rfcs:
  - "0023-surfaced-deviations"
  - "0082-ruby-ts-idiom-conversion-classes"
  - "0113-branch-and-guard-parity"
  - "0120-extra-surface-gating-rollout"
  - "0123-blocked-convergence-holding"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0130-activerecord-extra-surface-receipt-burndown"
  - "0131-activemodel-activerecord-api-parity-100"
  - "0154-ruby-compat-surfaced-deviations"
  - "0155-assertion-surfaced-port-bugs"
  - "0156-parity-beyond-name-presence"
  - "0170-psych-in-ruby-compat"
  - "0172-arel-parity-100"
  - "0173-activemodel-parity-100"
  - "0174-activerecord-api-parity-100"
priority: 2
---

# RFC — activerecord tests, assertions, fixtures and schema at 100%

## Summary

RFCs 0016 and 0030 took activerecord's test-name coverage to 97.6%, and 0132 its assertion ratchet near
zero. What is left: 138 missing and 64 skipped Rails tests, 46 wrong-describe and 1 misplaced, 4
assertion kind/value mismatches, 1,007 TS-only tests sitting in Rails-named files, ~200 Rails tests
excluded through the unported register, 6 fixture diffs and 30 unported fixture schemas, 74 invented
schema tables, and four test-infrastructure lint registers. **38 stories, 16,384 est-loc.**
Sibling of RFCs 0172, 0173, 0174 (source-side).

## Motivation

### Baseline

Measured 2026-09-30 on trails `main` @ `ea7d456048` after a clean `pnpm build`, with `pnpm parity:api` (+ `--calls`), `parity:api:calls`, `:calls:args`, `:params`, `:predicates`, `:extra`/`:extra:gate`, `:arms:throws`, `:arms:report`, `:blocks`, `:parents`, `:pins`, `:receipts:gate`, `:moves`, `:returns`, `:duck-types`, `:deps`, `parity:structural-duplicates:report`, `parity:test` (+ `--missing`), `parity:test:assertions`, `parity:fixtures`, `parity:schema`, and a grep of `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` / `@missingRailsName` receipts in `packages/<pkg>/src`.

| Axis                                                                           | Now                                                             | Target                                                            | Where the residue lives                                                                                                                 | Stories                                                                                 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `parity:test` tests                                                            | 8499/8704 (97.6%)                                               | 100% of scored                                                    | —                                                                                                                                       | all clusters                                                                            |
| missing                                                                        | 138                                                             | 0                                                                 | `migration/compatibility_test.rb` 38, `finder_test.rb` 35, `tasks/database_tasks_test.rb` 32, `i18n_validation_test.rb` 12, 12 files ≤4 | `missing-tests` cluster, `port-remaining-migration-compatibility-test-cases` (RFC 0155) |
| skipped (matched)                                                              | 64                                                              | 0 (3 while RFC 0155's access-control story is blocked)            | `relation/delegation_test.rb` 46, `attribute_methods_test.rb` 6, 9 files                                                                | `skipped-tests` cluster                                                                 |
| wrong describe / misplaced                                                     | 46 / 1                                                          | 0 / 0                                                             | `adapters/postgresql/range_test.rb`; `relations.trails.test.ts`                                                                         | `activerecord-range-test-describe-path-and-misplaced-find-by`                           |
| extra (TS only)                                                                | 1007                                                            | 0                                                                 | root 351, `relation/` 225 (delegation 160), `adapters/postgresql` 124, `encryption` 94, `associations` 87, …                            | `extra-tests` cluster                                                                   |
| files                                                                          | 353/353                                                         | hold                                                              | —                                                                                                                                       | —                                                                                       |
| `parity:test:assertions` mark                                                  | count 0, kind 4 (measures 3), value 1                           | 0/0/0                                                             | fixtures, yaml_serialization ×2, encryptable_record                                                                                     | `activerecord-assertion-kind-and-value-residue-to-zero`                                 |
| unported per-test entries                                                      | ~80 entries covering ~200 tests, 8 of them whole-file           | ratified § "Trails has no autoloader" + blocked fork/trilogy only | Thread/GVL, fork, Marshal, YAML, fixtures, visibility, Symbol, autoload, async                                                          | `unported-tests` cluster                                                                |
| `parity:fixtures`                                                              | 146 files: match 137, diff 6, erb-allowed 3; schema 113/143     | diff 0, erb 0, 143/143                                            | parrots, books, to_be_linked, reserved_words, …                                                                                         | `activerecord-fixture-parity-diffs-and-unported-fixture-schemas`                        |
| `parity:schema`                                                                | 74 baselined inventions, 4 option divergences, 2 shape warnings | 0                                                                 | `invented-baseline.json`; parrots timestamps; parrots/toys `integer`                                                                    | `schema-fixtures` cluster, RFC 0023 deps                                                |
| `no-standalone-associations-exclude.json`                                      | 90                                                              | 0                                                                 | 30+ test files                                                                                                                          | `activerecord-burn-no-standalone-associations-exclude`                                  |
| `require-canonical-rebuild-exclude.json` / `non-transactional-row-writes.json` | 17 / 9                                                          | 0 / 0                                                             | adapter + migration tests                                                                                                               | `activerecord-burn-canonical-rebuild-and-row-write-excludes`                            |
| `expected-fixtures-exclude.json` / `test-fixture-parity-exclude.json`          | 3 / 1                                                           | 0 / 0                                                             | batches, calculations, fixtures; habtm                                                                                                  | `activerecord-burn-expected-fixtures-and-fixture-parity-excludes`                       |
| `rails-test-name-parity` rollout                                               | not enrolled                                                    | enrolled                                                          | —                                                                                                                                       | `rails-test-name-parity-rollout-activerecord` (RFC 0127)                                |

## Design

### Principles

- **Converge, never ratify.** A row in any register (`call-mismatches-exclude/`, `arity-exclude.json`,
  `SKIP_GROUPS`, `SCOPED_SKIP_GROUPS`, `unported-files/`, the eslint excludes, a mark file) is debt. Each
  story deletes rows; none adds one. The only residue allowed at the end is a receipt or skip that a
  CLAUDE.md section ratifies, cited in the close-out PR body.
- **Blocked, not ratified.** Where a story hits a gap CLAUDE.md does not ratify, it is filed `blocked`
  with the concrete blocker (see § "Blocked"), never re-worded into a PERMANENT receipt.
- **Measurement faults are fixed in the tool.** Several report-only axes are mostly noise today (moves'
  include-chain rows, the `if` arm token, option keys' declared-type keys). Those stories fix the extractor
  with a unit test instead of editing a correct port, and depend on the tooling story that owns the fault.
- **One owner per row.** Prior-art stories in other RFCs are wired as `deps`, not re-authored
  (§ "Existing stories"). Every CONVERGEABLE receipt that already names a story counts as covered.
- **Each story is one PR.** `est-loc` ≤ 650 against the 700 ceiling; files do not overlap between stories
  except where a `deps` edge orders them.
- **Close-out pins zero.** The last story re-measures and turns each remaining ratchet into a hard zero
  (rowless extra-surface, empty baselines, marks at 0) so the package cannot regress.

### The unported register is re-read, not trusted

Most per-test exclusions were written before a carrier existed: RFC 0147 (execution context at thread
spawn sites) and RFC 0148 (`catch`/`throw`) are closed; ruby-compat has `DelegateClass`, `rbModPrivate`,
`rbObjSingletonClass`; Marshal and Psych are in flight (RFCs 0154, 0170). Each `unported-tests` story
re-reads its entries' reasons against today's carriers and ports what is now portable. What survives is
either ratified (§ "Trails has no autoloader") or blocked with a named blocker.

### Existing stories this RFC depends on

| Existing story                                               | RFC  | Status  | Needed by                                                                                                                           |
| ------------------------------------------------------------ | ---- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `port-finder-aggregate-find-by-cluster`                      | 0023 | draft   | `activerecord-port-finder-test-find-by-cases`, `activerecord-test-parity-100-close-out`                                             |
| `port-finder-find-without-primary-key-onto-matey`            | 0023 | draft   | `activerecord-port-finder-test-remaining-cases`                                                                                     |
| `test-extractor-expands-hash-and-const-define-method-loops`  | 0025 | draft   | `activerecord-port-database-tasks-per-adapter-cases`, `activerecord-unskip-relation-delegation-tests`                               |
| `i18n-validation-test-uses-ad-hoc-topic-models`              | 0023 | draft   | `activerecord-port-i18n-validation-uniqueness-and-associated-cases`                                                                 |
| `database-statements-exec-insert-test`                       | 0023 | draft   | `activerecord-port-adapter-and-migrator-missing-cases`                                                                              |
| `converge-delegated-classes-onto-rails-literal-list`         | 0082 | draft   | `activerecord-unskip-relation-delegation-tests`                                                                                     |
| `psych-load-and-safe-load`                                   | 0170 | draft   | `activerecord-unskip-remaining-matched-skips`, `activerecord-assertion-kind-and-value-residue-to-zero`                              |
| `activerecord-private-attribute-methods-are-still-public`    | 0155 | blocked | `activerecord-unskip-remaining-matched-skips`                                                                                       |
| `string-encoding-tag-carrier-for-force-encoding-and-b`       | 0154 | draft   | `activerecord-assertion-kind-and-value-residue-to-zero`                                                                             |
| `drop-stale-deadlock-unported-file-exclusions`               | 0127 | draft   | `activerecord-port-thread-excluded-tests-transactions-and-scoping`                                                                  |
| `ruby-compat-marshal-core-types`                             | 0154 | draft   | `activerecord-port-marshal-excluded-tests`                                                                                          |
| `yaml-column-safe-coder-through-psych`                       | 0170 | draft   | `activerecord-port-yaml-excluded-tests`                                                                                             |
| `schema-cache-dump-and-load-through-psych`                   | 0170 | draft   | `activerecord-port-yaml-excluded-tests`                                                                                             |
| `relation-to-yaml-psych-dump`                                | 0155 | blocked | `activerecord-port-yaml-excluded-tests`                                                                                             |
| `psych-load-file-family`                                     | 0170 | draft   | `activerecord-port-fixtures-test-excluded-cases-files-and-paths`                                                                    |
| `port-fixtures-test-rb-fixture-declarations`                 | 0023 | draft   | `activerecord-port-fixtures-test-excluded-cases-files-and-paths`, `activerecord-burn-expected-fixtures-and-fixture-parity-excludes` |
| `port-test-fixtures-class-attribute-declarations`            | 0023 | draft   | `activerecord-port-fixtures-test-excluded-cases-lifecycle`                                                                          |
| `audit-load-async-surface-portability`                       | 0023 | draft   | `activerecord-port-async-query-excluded-tests`                                                                                      |
| `rational-value-quoting-analogue`                            | 0082 | draft   | `activerecord-port-misc-excluded-tests`                                                                                             |
| `ruby-mutable-string-carrier`                                | 0155 | blocked | `activerecord-port-misc-excluded-tests`                                                                                             |
| `test-schema-parrots-timestamp-precision-0`                  | 0023 | draft   | `activerecord-fixture-parity-diffs-and-unported-fixture-schemas`, `activerecord-test-parity-100-close-out`                          |
| `test-schema-port-parrots-toys-integer-column`               | 0023 | draft   | `activerecord-fixture-parity-diffs-and-unported-fixture-schemas`, `activerecord-test-parity-100-close-out`                          |
| `prune-stale-lint-ratchet-allowlists`                        | 0127 | draft   | `activerecord-burn-no-standalone-associations-exclude`                                                                              |
| `port-remaining-migration-compatibility-test-cases`          | 0155 | ready   | `activerecord-test-parity-100-close-out`                                                                                            |
| `rails-test-name-parity-rollout-activerecord`                | 0127 | draft   | `activerecord-test-parity-100-close-out`                                                                                            |
| `flip-assertion-mismatch-gate-to-hard-zero`                  | 0123 | blocked | `activerecord-test-parity-100-close-out`                                                                                            |
| `finder-find-with-string-ports-findbysql-not-string-id-cast` | 0023 | draft   | `activerecord-test-parity-100-close-out`                                                                                            |

## Stories

| Story                                                                | est-loc | Cluster         |
| -------------------------------------------------------------------- | ------- | --------------- |
| `activerecord-port-finder-test-find-by-cases`                        | 450     | missing-tests   |
| `activerecord-port-finder-test-remaining-cases`                      | 450     | missing-tests   |
| `activerecord-port-database-tasks-per-adapter-cases`                 | 550     | missing-tests   |
| `activerecord-port-i18n-validation-uniqueness-and-associated-cases`  | 300     | missing-tests   |
| `activerecord-port-model-and-association-missing-cases`              | 450     | missing-tests   |
| `activerecord-port-adapter-and-migrator-missing-cases`               | 350     | missing-tests   |
| `activerecord-unskip-relation-delegation-tests`                      | 600     | skipped-tests   |
| `activerecord-unskip-remaining-matched-skips`                        | 450     | skipped-tests   |
| `activerecord-range-test-describe-path-and-misplaced-find-by`        | 200     | skipped-tests   |
| `activerecord-assertion-kind-and-value-residue-to-zero`              | 200     | skipped-tests   |
| `activerecord-relocate-ts-only-tests-root-part-1`                    | 650     | extra-tests     |
| `activerecord-relocate-ts-only-tests-root-part-2`                    | 650     | extra-tests     |
| `activerecord-relocate-ts-only-tests-relation`                       | 320     | extra-tests     |
| `activerecord-relocate-ts-only-tests-adapters-postgresql`            | 396     | extra-tests     |
| `activerecord-relocate-ts-only-tests-encryption`                     | 436     | extra-tests     |
| `activerecord-relocate-ts-only-tests-associations`                   | 408     | extra-tests     |
| `activerecord-relocate-ts-only-tests-connection-adapters`            | 300     | extra-tests     |
| `activerecord-relocate-ts-only-tests-smaller-dirs`                   | 324     | extra-tests     |
| `activerecord-port-thread-excluded-tests-pool-and-cache`             | 600     | unported-tests  |
| `activerecord-port-thread-excluded-tests-transactions-and-scoping`   | 550     | unported-tests  |
| `activerecord-fork-excluded-tests` (blocked)                         | 300     | unported-tests  |
| `activerecord-port-marshal-excluded-tests`                           | 450     | unported-tests  |
| `activerecord-port-yaml-excluded-tests`                              | 500     | unported-tests  |
| `activerecord-port-fixtures-test-excluded-cases-files-and-paths`     | 550     | unported-tests  |
| `activerecord-port-fixtures-test-excluded-cases-lifecycle`           | 500     | unported-tests  |
| `activerecord-port-visibility-and-symbol-excluded-tests`             | 350     | unported-tests  |
| `activerecord-audit-autoload-and-constant-lookup-excluded-tests`     | 350     | unported-tests  |
| `activerecord-port-async-query-excluded-tests`                       | 550     | unported-tests  |
| `activerecord-port-misc-excluded-tests`                              | 550     | unported-tests  |
| `activerecord-delete-dead-invented-schema-tables`                    | 300     | schema-fixtures |
| `activerecord-converge-clients-firms-invented-tables-onto-companies` | 600     | schema-fixtures |
| `activerecord-converge-targets-invented-table`                       | 450     | schema-fixtures |
| `activerecord-converge-remaining-invented-tables`                    | 450     | schema-fixtures |
| `activerecord-fixture-parity-diffs-and-unported-fixture-schemas`     | 500     | schema-fixtures |
| `activerecord-burn-no-standalone-associations-exclude`               | 500     | lint-registers  |
| `activerecord-burn-canonical-rebuild-and-row-write-excludes`         | 450     | lint-registers  |
| `activerecord-burn-expected-fixtures-and-fixture-parity-excludes`    | 250     | lint-registers  |
| `activerecord-test-parity-100-close-out`                             | 150     | closeout        |

## Blocked

- `activerecord-fork-excluded-tests` — Runtime shortcoming, not ratified in CLAUDE.md: Node has no fork() that copies the parent heap (child_process.fork starts a fresh process), so per-pid state after a fork cannot be reproduced. Needs a CLAUDE.md ratification decision or a fork-emulation design.

## Non-goals

- **Rewriting the parity tools' scoring model.** Where a tool is wrong, the owning story fixes that one
  fault with a test; broader tooling redesign stays in RFCs 0127 / 0156.
- **Ratifying new CLAUDE.md sections.** A story that finds a genuine language shortcoming is filed
  `blocked` with the blocker; deciding to ratify is a separate, explicit decision.
- **`no-explicit-any` allowlists.** They are type-hygiene registers, not parity axes.
- **Other packages.** activesupport, actionpack, trailties and ruby-compat have their own parity RFCs;
  ruby-compat work appears here only where an activerecord/activemodel/arel row needs a carrier.

- **activerecord's source-side axes.** RFC 0174.

## Alternatives considered

- **Keeping the fork-based tests out with a reworded reason.** Rejected: that is ratifying by prose; the
  story is filed `blocked` with the runtime blocker instead.
- **Deleting TS-only tests wholesale.** Rejected: some are Rails tests under a drifted name, and some are
  the only coverage of a trails-specific seam; each is classified.

## Rollout

1. **Missing and skipped tests** — `activerecord-port-finder-test-find-by-cases`, `activerecord-port-finder-test-remaining-cases`, `activerecord-port-database-tasks-per-adapter-cases`, `activerecord-port-i18n-validation-uniqueness-and-associated-cases`, `activerecord-port-model-and-association-missing-cases`, `activerecord-port-adapter-and-migrator-missing-cases`, `activerecord-unskip-relation-delegation-tests`, `activerecord-unskip-remaining-matched-skips`, `activerecord-range-test-describe-path-and-misplaced-find-by`, `activerecord-assertion-kind-and-value-residue-to-zero`
2. **Unported register** — `activerecord-port-thread-excluded-tests-pool-and-cache`, `activerecord-port-thread-excluded-tests-transactions-and-scoping`, `activerecord-fork-excluded-tests`, `activerecord-port-marshal-excluded-tests`, `activerecord-port-yaml-excluded-tests`, `activerecord-port-fixtures-test-excluded-cases-files-and-paths`, `activerecord-port-fixtures-test-excluded-cases-lifecycle`, `activerecord-port-visibility-and-symbol-excluded-tests`, `activerecord-audit-autoload-and-constant-lookup-excluded-tests`, `activerecord-port-async-query-excluded-tests`, `activerecord-port-misc-excluded-tests`
3. **TS-only tests** — `activerecord-relocate-ts-only-tests-root-part-1`, `activerecord-relocate-ts-only-tests-root-part-2`, `activerecord-relocate-ts-only-tests-relation`, `activerecord-relocate-ts-only-tests-adapters-postgresql`, `activerecord-relocate-ts-only-tests-encryption`, `activerecord-relocate-ts-only-tests-associations`, `activerecord-relocate-ts-only-tests-connection-adapters`, `activerecord-relocate-ts-only-tests-smaller-dirs`
4. **Schema, fixtures and lint registers** — `activerecord-delete-dead-invented-schema-tables`, `activerecord-converge-clients-firms-invented-tables-onto-companies`, `activerecord-converge-targets-invented-table`, `activerecord-converge-remaining-invented-tables`, `activerecord-fixture-parity-diffs-and-unported-fixture-schemas`, `activerecord-burn-no-standalone-associations-exclude`, `activerecord-burn-canonical-rebuild-and-row-write-excludes`, `activerecord-burn-expected-fixtures-and-fixture-parity-excludes`
5. **Close-out** — `activerecord-test-parity-100-close-out`

## Verification

`activerecord-test-parity-100-close-out`'s acceptance criteria are the verification, with the named
blocked residue: the fork-based tests (`activerecord-fork-excluded-tests`) and the trilogy cases.

## Open questions

1. **Are the Zeitwerk/loader tests allowed residue?** Resolved: yes, where the test exercises the loader
   itself — § "Trails has no autoloader" ratifies it; constant-path resolution for associations is not the
   loader and is ported.

## Changelog

- 2026-09-30: initial RFC (38 stories, 16,384 est-loc).
