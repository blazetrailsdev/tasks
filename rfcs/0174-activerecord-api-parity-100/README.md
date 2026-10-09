---
rfc: "0174-activerecord-api-parity-100"
title: "activerecord source at 100% on the name, skip, call and pin axes, and the close-out for every source-side axis"
status: active
created: 2026-09-30
updated: 2026-10-06
owner: "@deanmarano"
packages:
  - "activerecord"
  - "ruby-compat"
  - "activesupport"
  - "actionpack"
  - "activemodel"
  - "trailties"
  - "actionview"
clusters:
  - api-surface
  - calls-args
  - closeout
  - pins
  - skips
  - tooling
  - "excluded-files"
  - "placement"
  - "convergeable"
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
  - "0175-activerecord-test-parity-100"
  - "0178-activerecord-arms-parity-100"
  - "0179-api-compare-crediting-rules"
  - "0180-activerecord-receipt-parity"
  - "0181-activerecord-member-placement"
  - "0182-activerecord-error-parity"
  - "0183-activerecord-excluded-source-files"
priority: 2
---

# RFC 0174 — activerecord source at 100%: names, skips, calls, pins, and the close-out

## Summary

activerecord is the largest port and carried most of the source-side residue. This RFC was seeded on
2026-09-30 with every source-side axis and seven RFCs have been split out of it since (§ "Changelog"). **What it
holds now:**

- **`api-surface`**: name misses, inheritance and arity mismatches, and the `parity:api:deps` lint.
- **`skips`**: the non-ratified `SKIP_GROUPS` / `SCOPED_SKIP_GROUPS` entries.
- **`calls-args`**: the `parity:api:calls` and `:calls:args` baseline rows, and option keys.
- **`pins`**: the unpinned bodies.
- **`tooling`** and the unclustered surfaced deviations: 131 stories that name a wrong body and no register.
- **`closeout`**: `activerecord-api-parity-100-close-out`, the one story that re-measures **every**
  source-side axis and pins each gate at zero. It waits on each split-out RFC through one `deps-rfc` edge.

**As of 2026-10-06: 166 stories, 127 open, 15,275 est-loc.** The other source-side axes are owned by:

| Axis                                                              | RFC                                         |
| ----------------------------------------------------------------- | ------------------------------------------- |
| tests, assertions, fixtures, schema                               | `0175-activerecord-test-parity-100`         |
| control-flow arms, void returns, duck-type guards                 | `0178-activerecord-arms-parity-100`         |
| comparer crediting rules                                          | `0179-api-compare-crediting-rules` (closed) |
| deviation receipts (PERMANENT audits, CONVERGEABLE convergence)   | `0180-activerecord-receipt-parity`          |
| inlined module bodies and moves                                   | `0181-activerecord-member-placement`        |
| error class, message and raise site; the two eslint exclude files | `0182-activerecord-error-parity`            |
| excluded source files                                             | `0183-activerecord-excluded-source-files`   |

Note: there is no `activerecord-surfaced-deviations` bucket. The unclustered stories here are that
bucket in practice (§ "Open questions" 1). The retired RFC 0023 still holds 319 activerecord drafts; the
ones RFCs 0172–0175 depend on, together with those in the postponed RFCs 0025 and 0082, were rehomed by
`parity-100-rehome-postponed-rfc-dependencies` (done).

## Motivation

### Baseline

This is the seeding baseline, kept whole because the close-out re-measures every row of it. The "Stories"
column names the RFC that owns a row where it is no longer this one; each of those RFCs carries a baseline
re-measured on the day it was split out.

Measured 2026-09-30 on trails `main` @ `ea7d456048` after a clean `pnpm build`, with `pnpm parity:api` (+ `--calls`), `parity:api:calls`, `:calls:args`, `:params`, `:predicates`, `:extra`/`:extra:gate`, `:arms:throws`, `:arms:report`, `:blocks`, `:parents`, `:pins`, `:receipts:gate`, `:moves`, `:returns`, `:duck-types`, `:deps`, `parity:structural-duplicates:report`, `parity:test` (+ `--missing`), `parity:test:assertions`, `parity:fixtures`, `parity:schema`, and a grep of `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` / `@missingRailsName` receipts in `packages/<pkg>/src`.

| Axis                                                                       | Now                                                                                                     | Target                                    | Where the residue lives                                                                                                 | Stories                                                                                                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `parity:api` methods                                                       | 6789/6847 (99.2%)                                                                                       | 100%                                      | 23 files; largest `migration/compatibility.rb` 18, `postgresql_adapter.rb` 6, `encryption/contexts.rb` 6                | `api-surface` cluster + RFC 0156/0155 deps                                                                                          |
| files                                                                      | 288/288                                                                                                 | hold                                      | —                                                                                                                       | —                                                                                                                                   |
| inheritance                                                                | 209/217                                                                                                 | 100%                                      | 5 `DelegateClass` supers, 2 `TypeMetadata`, `OID::DateTime`                                                             | `activerecord-inheritance-residue-delegate-class-supers`                                                                            |
| arity                                                                      | 3730/3731                                                                                               | 100%                                      | `disable_joins_association_scope.rb#add_constraints`                                                                    | `activerecord-disable-joins-association-scope-add-constraints-arity`                                                                |
| params / predicates                                                        | 2480/2480, 0                                                                                            | hold                                      | —                                                                                                                       | —                                                                                                                                   |
| excluded source files                                                      | 13 (152 defs)                                                                                           | trilogy (decided), `promise.rb` (decided) | `unported-files/unscoped.ts`                                                                                            | RFC 0183, `port-destroy-association-async-job` (RFC 0116)                                                                           |
| global skip (non-ratified)                                                 | `SKIP_GROUPS` 0/7/8/9/10: 45 defs incl. `ModelSchema.load_schema!`, `Association#target`                | 0                                         | `scripts/parity/conventions.ts`                                                                                         | `skips` cluster                                                                                                                     |
| global skip (ratified hooks)                                               | 31 (`method_missing` family 17, lifecycle hooks 14)                                                     | ratified only, bodies audited             | `SKIP_GROUPS[3]`/`[4]`/`[5]`                                                                                            | `activerecord-lifecycle-hook-semantics-audit`, `activerecord-test-fixtures-method-missing-accessors`                                |
| scoped skip                                                                | `SCOPED_SKIP_GROUPS[11]` (`-@`, 5 files) and `[15]` (`Fixture#initialize`, 2 files)                     | 0                                         | `SCOPED_SKIP_GROUPS[11]`, `[15]`                                                                                        | `activerecord-deduplicable-deduplicated-and-unary-minus`, `activerecord-fixture-initialize-prepend-constructor` (RFC 0183, blocked) |
| body pins                                                                  | 4468/4544 (76)                                                                                          | 100%                                      | 59 protocol defs + 17 `compatibility.rb`                                                                                | `pins` cluster                                                                                                                      |
| `parity:api:calls` rows                                                    | 53 (133 unreviewed repo-wide)                                                                           | 0                                         | 30 shards                                                                                                               | 10 stories + `converge-same-name-second-owner-call-rows`, `burn-down-rfc0126-repairing-surfaced-call-rows`                          |
| `parity:api:calls:args` shape rows                                         | 8                                                                                                       | 0                                         | alias-tracker, preloader/through ×2, mysql2, inheritance, insert-all, calculations ×2                                   | `calls-args` cluster                                                                                                                |
| naming rows                                                                | 0 (60 `@missingRailsName` PERMANENT)                                                                    | ratified only                             | —                                                                                                                       | RFC 0180                                                                                                                            |
| `parity:api:extra:gate`                                                    | rowless (novel 0 / total 0)                                                                             | hold                                      | —                                                                                                                       | —                                                                                                                                   |
| extra: inlined module bodies (report-only)                                 | 128                                                                                                     | 0, then gated                             | `base.ts` ← callbacks/core/persistence/…, `relation.ts` ← query_methods, `postgresql-adapter.ts` ← pg schema_statements | RFC 0181                                                                                                                            |
| CONVERGEABLE receipts naming a story                                       | 44                                                                                                      | converge via their stories                | 20 stories in RFCs 0023/0082/0123/0155                                                                                  | close-out deps; RFC 0180 for the ones it owns                                                                                       |
| CONVERGEABLE receipts naming **no** story                                  | 60                                                                                                      | 0                                         | `command-recorder.ts` 18, `test-adapter.ts`, `inheritance.ts`, `model-schema.ts`, …                                     | RFC 0180                                                                                                                            |
| PERMANENT receipts                                                         | 417 (136 `@noRailsEquivalent`, 194 `@missingRailsCall`, 27 `@missingRailsArgs`, 60 `@missingRailsName`) | ratified only                             | all directories                                                                                                         | RFC 0180                                                                                                                            |
| `parity:api:arms:throws` / `:blocks` / `:parents`                          | 0 / 9 / 3                                                                                               | 0 / 0 / 0                                 | blocks: `relation/batches.rb`, `base.rb`, …; parents: `Base`, `Calculations`, `InstanceMethods`                         | `converge-activerecord-dropped-block-arms-remainder`, `burn-down-the-ambiguous-parent-remainder`                                    |
| arms report                                                                | 129 missing / 903 invented pairs (2,109 invented tokens)                                                | 0                                         | everywhere                                                                                                              | RFC 0178 (`0178-activerecord-arms-parity-100`)                                                                                      |
| `parity:api:moves`                                                         | 947                                                                                                     | 0                                         | mostly include-chain double counting                                                                                    | RFC 0181                                                                                                                            |
| `parity:api:returns` / `:duck-types`                                       | 51 / 8                                                                                                  | 0                                         | adapters, schema statements, tasks                                                                                      | RFC 0178                                                                                                                            |
| `parity:api:deps`                                                          | → arel 3+1, → activemodel 10+1, → activesupport 7 ✗                                                     | 0                                         | `insert-all.ts`, `attributes.ts`, `migration.ts`, …                                                                     | `activerecord-deps-lint-to-zero`                                                                                                    |
| option keys (advisory)                                                     | 46 (3 likely-real)                                                                                      | 0                                         | schema definitions/statements                                                                                           | `activerecord-option-keys-missing-in-ts`; the extractor fault is in RFC 0179                                                        |
| literals (advisory)                                                        | 1                                                                                                       | 0                                         | `sanitization.rb` `escape_character` (normalizer fault)                                                                 | RFC 0179                                                                                                                            |
| protocol-call enrollment                                                   | activerecord not in `PROTOCOL_CALL_ENROLLED_PACKAGES` (46 rows)                                         | enrolled                                  | —                                                                                                                       | `enroll-activerecord-in-protocol-call-mapping` (RFC 0156)                                                                           |
| structural duplicates (report) / `no-ruby-compat-reimplementation-exclude` | 131 / 2                                                                                                 | 0 / 0                                     | —                                                                                                                       | `activerecord-triage-structural-duplicates-of-ruby-compat`                                                                          |
| `rails-error-parity-exclude.json`                                          | 74 activerecord files                                                                                   | 0                                         | all directories                                                                                                         | RFC 0182                                                                                                                            |
| `rails-callback-invocations-exclude.json`                                  | 5                                                                                                       | 0                                         | `callbacks.ts`, `core.ts`, `transactions.ts`                                                                            | RFC 0182                                                                                                                            |
| `arity-exclude.json` / `inheritance-exclude.json`                          | 0 / 0                                                                                                   | hold                                      | —                                                                                                                       | `promote-arity-mismatches-to-ratchet` (RFC 0127) gates it                                                                           |

## Design

### Principles

- **Converge, never ratify.** A row in any register (`call-mismatches-exclude/`, `arity-exclude.json`,
  `SKIP_GROUPS`, `SCOPED_SKIP_GROUPS`, `unported-files/`, the eslint excludes, a mark file) is debt. Each
  story deletes rows; none adds one. The only residue allowed at the end is a receipt or skip that a
  CLAUDE.md section ratifies, cited in the close-out PR body.
- **Blocked, not ratified.** Where a story hits a gap CLAUDE.md does not ratify, it is filed `blocked`
  with the concrete blocker (see § "Blocked"), never re-worded into a PERMANENT receipt.
- **Measurement faults are fixed in the tool.** Several report-only axes are mostly noise today (moves'
  include-chain rows, the `if` arm token, option keys' declared-type keys). The fix is in the extractor,
  with a unit test, never an edit to a correct port. The fault story is filed in the RFC that owns the
  tool: `0179-api-compare-crediting-rules` for the call-set gate, the call-argument gate, the extra-surface
  scorer and the advisory reports (closed on 2026-10-03; a new one goes to RFC 0127), `0178-activerecord-arms-parity-100` for the arms, void-return and
  duck-type extractors, and RFC 0127 for moves. A port story here whose rows the fault inflates takes a
  `deps` edge on that fault story.
- **One owner per row.** Prior-art stories in other RFCs are wired as `deps`, not re-authored
  (§ "Existing stories"). Every CONVERGEABLE receipt that already names a story counts as covered.
- **Each story is one PR.** `est-loc` ≤ 650 against the 700 ceiling. Where two stories rewrite the same
  method bodies, a `deps` edge orders them. The receipt audits and the report-driven stories (arms,
  moves, pins) touch many files lightly; each lists its exact sites, so a conflict is a rebase, not a
  redesign.
- **Every story names its axis.** Acceptance criteria state the number the story moves and the rows,
  marks or entries it deletes; each story ends with the `## Verification` commands that prove it.
- **Close-out pins zero.** The last story re-measures and turns each remaining ratchet into a hard zero
  (rowless extra-surface, empty baselines, marks at 0) so the package cannot regress.

### Ordering

- `arel-score-core-object-names-nil-and-case-then` (RFC 0172) adds the `nil?` mapping every later
  `SKIP_GROUPS[0]` story uses, so `activerecord-score-core-object-protocol-names` depends on it.
- The placement, receipt, error and excluded-file stories are ordered in RFCs 0181, 0180, 0182 and 0183.
  Seven open `deps` edges cross between those RFCs and this one; each RFC's § "Gating" lists its own.
- The arms, void-return and duck-type stories are ordered in RFC 0178 § "Ordering".
- `parity-100-rehome-postponed-rfc-dependencies` runs first after merge (see § "Gating").

### Gating: why `status: active`, and where `deps-rfc` is used

- **`active` from birth.** `claimable()` (`src/ranking.ts`) surfaces a story only when its own RFC is
  `active`, its status is `ready`, and every `deps` entry is `done` or `closed`. So `active` makes the
  **54** stories here with no dependencies claimable at merge. Every other story stays out of
  `tasks ready` until its own dependencies land. Landing the RFC as `draft` would hold back those
  54 stories and gate nothing the `deps` edges do not already gate.
- **Postponed-RFC dependencies go through one rehome story.** 8 stories here depend on stories in
  RFCs 0023, 0025 or 0082, which are `postponed`, so their stories are never claimable. Each of those
  8 stories also depends on `parity-100-rehome-postponed-rfc-dependencies` (in RFC 0174, `priority: 1`).
  That story rehomes them into these RFCs after merge, so the ordering is in the data.
- **Draft-RFC dependencies** — by RFC: 0041 (1), 0116 (1), 0120 (2), 0127 (10), 0170 (4). A story depending on a story in a `draft` RFC waits
  for that story to be `done`, and that cannot happen before its RFC goes `active`. The gate is therefore
  the story-level `deps` edge, applied transitively.
- **`deps-rfc` is left empty on every story but the close-out.** The close-out carries one edge per
  split-out RFC (0178, 0179, 0180 to 0183), because it does wait for each of them to finish entirely. `deps-rfc` means "until that RFC is **closed**" (`claimable()`:
  `s.deps_rfc.some((d) => rfcStatus.get(d) !== "closed")`), not "until it is active". Setting it to a draft
  RFC would hold a story until that entire RFC finished, long after the one story it needs has landed.
  Existing uses (`0019-canonical-schema-burndown`, `0063-async-validation-chain`) are that whole-RFC case.

### Existing stories this RFC depends on

As seeded. A "Needed by" story that has since moved is now in RFC 0180, 0181, 0182 or 0183; slugs did not
change, so each still resolves.

| Existing story                                                            | RFC (status)     | Story status | Needed by                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `psych-object-to-yaml`                                                    | 0170 (draft)     | draft        | `activerecord-relation-encode-with-and-strict-loading-scope`, `activerecord-delegation-encode-with-and-class-specific-relation-name`                                                                             |
| `api-compare-nulls-a-delegateclass-superclass`                            | 0120 (draft)     | draft        | `activerecord-inheritance-residue-delegate-class-supers`                                                                                                                                                         |
| `add-constraints-guards-constraints-call-and-lambda-type`                 | 0023 (postponed) | draft        | `activerecord-disable-joins-association-scope-add-constraints-arity`                                                                                                                                             |
| `ruby-compat-marshal-core-types`                                          | 0154 (active)    | draft        | `activerecord-port-marshalling-module`                                                                                                                                                                           |
| `message-pack-serializer-pool-and-packer-block`                           | 0041 (draft)     | draft        | `activerecord-port-message-pack-module`                                                                                                                                                                          |
| `port-promise-complete-for-async-loaded-arms`                             | 0023 (postponed) | draft        | `activerecord-port-promise`                                                                                                                                                                                      |
| `yaml-column-safe-coder-through-psych`                                    | 0170 (draft)     | draft        | `activerecord-port-legacy-yaml-adapter-and-yaml-column`, `activerecord-api-parity-100-close-out`                                                                                                                 |
| `active-record-legacy-yaml-load-tags`                                     | 0170 (draft)     | draft        | `activerecord-port-legacy-yaml-adapter-and-yaml-column`                                                                                                                                                          |
| `port-insert-all-extract-types-from-columns-on`                           | 0023 (postponed) | draft        | `activerecord-converge-insert-all-builder-rows`                                                                                                                                                                  |
| `load-from-sql-iterates-indexed-rows`                                     | 0023 (postponed) | draft        | `activerecord-converge-load-from-sql-instantiate-instance-of`                                                                                                                                                    |
| `sync-reads-of-async-reflection-retire-with-rfc-0073`                     | 0123 (active)    | blocked      | `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`, `activerecord-api-parity-100-close-out`                                                                                               |
| `converge-shard-selector-lock-fetch`                                      | 0082 (postponed) | draft        | `activerecord-converge-selector-middleware-convergeable-receipts`                                                                                                                                                |
| `port-hash-eql-rows-surfaced-by-scoring`                                  | 0156 (active)    | ready        | `activerecord-verify-and-pin-protocol-bodies`, `activerecord-api-parity-100-close-out`                                                                                                                           |
| `compatibility-module-members-unmeasured-by-parity-api`                   | 0155 (active)    | ready        | `activerecord-verify-and-pin-migration-compatibility`, `activerecord-api-parity-100-close-out`                                                                                                                   |
| `port-remaining-migration-compatibility-test-cases`                       | 0155 (active)    | ready        | `activerecord-verify-and-pin-migration-compatibility`                                                                                                                                                            |
| `converge-delegated-type-method-split`                                    | 0023 (postponed) | draft        | `activerecord-option-keys-missing-in-ts`                                                                                                                                                                         |
| `moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced` | 0127 (draft)     | draft        | `activerecord-converge-moves-residue-base-hosted`, `activerecord-converge-moves-residue-relation-hosted`, `activerecord-converge-moves-residue-adapter-hosted` …                                                 |
| `retire-dead-error-parity-disables-and-stale-arm-throw-marks`             | 0127 (draft)     | draft        | `activerecord-burn-rails-error-parity-exclude-root`, `activerecord-burn-rails-error-parity-exclude-connection-adapters`, `activerecord-burn-rails-error-parity-exclude-associations-relation-encryption-tasks` … |
| `converge-activerecord-dropped-block-arms-remainder`                      | 0156 (active)    | ready        | `activerecord-burn-rails-callback-invocations-exclude`, `activerecord-api-parity-100-close-out`                                                                                                                  |
| `port-remaining-class-hosted-accessor-instance-seats`                     | 0156 (active)    | ready        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `port-non-accessor-rows-from-level-keyed-set`                             | 0156 (active)    | ready        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `enroll-activerecord-in-protocol-call-mapping`                            | 0156 (active)    | ready        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `converge-same-name-second-owner-call-rows`                               | 0156 (active)    | ready        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `burn-down-rfc0126-repairing-surfaced-call-rows`                          | 0023 (postponed) | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `burn-down-the-ambiguous-parent-remainder`                                | 0127 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `port-destroy-association-async-job`                                      | 0116 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `schema-cache-dump-and-load-through-psych`                                | 0170 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `serialize-accepts-yaml-module-as-coder`                                  | 0170 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `with-yaml-fallback-through-yaml-dump`                                    | 0170 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `ruby-compat-has-no-marshal-for-schema-cache-and-debug`                   | 0154 (active)    | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `promote-arity-mismatches-to-ratchet`                                     | 0127 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `name-stories-for-activerecord-malformed-deviation-receipts`              | 0127 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `convergeable-tag-story-id`                                               | 0120 (draft)     | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `converge-djar-deferred-chain-walk-mode`                                  | 0023 (postponed) | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `association-helpers-extracted-for-the-collection-proxy-remainder-3`      | 0123 (active)    | ready        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `sync-collection-mass-assignment-refuses-rails-replace`                   | 0155 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `generated-attribute-methods-name-comes-from-const-set`                   | 0023 (postponed) | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `update-must-call-assign-attributes-carried-from-0087`                    | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `union-order-clauses-is-a-second-spelling-of-ruby-array-union`            | 0082 (postponed) | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `pg-max-identifier-length-sync-async-split`                               | 0023 (postponed) | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `pg-lookup-cast-type-resolves-only-warmed-type-names`                     | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `disambiguate-association-vs-collection-proxy-accessor`                   | 0023 (postponed) | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `base-constructor-calls-init-internals-not-activemodel`                   | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `eliminate-pending-counter-cache-deferral-via-lazy-target-resolution`     | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `insert-all-constructor-reads-the-schema-cache-at-its-rails-call-sites`   | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `cache-version-fast-path-reads-global-default-timezone`                   | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `converge-collection-writer-isthenable-dual-returns`                      | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `retire-ids-name-helper-constructor-dispatch`                             | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `converge-has-one-builder-define-writers`                                 | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `mysql-quote-string-escapes-without-with-raw-connection`                  | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `port-multibyte-chars-and-string-mb-chars`                                | 0023 (postponed) | draft        | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |
| `pg-quote-string-escapes-without-with-raw-connection`                     | 0123 (active)    | blocked      | `activerecord-api-parity-100-close-out`                                                                                                                                                                          |

## Stories

The seeded stories that are still here. The 131 unclustered stories filed since are not tabled:
`pnpm tasks list --rfc 0174-activerecord-api-parity-100`.

| Story                                                                  | est-loc | Cluster     |
| ---------------------------------------------------------------------- | ------- | ----------- |
| `activerecord-port-associations-eager-load-bang`                       | 80      | api-surface |
| `activerecord-deduplicable-deduplicated-and-unary-minus`               | 250     | api-surface |
| `activerecord-core-attributes-for-inspect`                             | 100     | api-surface |
| `activerecord-encryption-contexts-thread-mattr-accessors`              | 180     | api-surface |
| `activerecord-extended-deterministic-queries-core-queries-find-by`     | 100     | api-surface |
| `activerecord-relation-encode-with-and-strict-loading-scope`           | 180     | api-surface |
| `activerecord-delegation-encode-with-and-class-specific-relation-name` | 120     | api-surface |
| `activerecord-result-indexed-row-to-h`                                 | 60      | api-surface |
| `activerecord-type-registry-copy-and-serialized-inspect`               | 100     | api-surface |
| `activerecord-inheritance-residue-delegate-class-supers`               | 250     | api-surface |
| `activerecord-disable-joins-association-scope-add-constraints-arity`   | 200     | api-surface |
| `activerecord-retire-migrator-index-helpers-skip`                      | 350     | skips       |
| `activerecord-retire-check-pending-skip`                               | 350     | skips       |
| `activerecord-retire-class-attribute-slot-skip`                        | 350     | skips       |
| `activerecord-retire-no-touching-klasses-skip`                         | 120     | skips       |
| `activerecord-score-core-object-protocol-names`                        | 300     | skips       |
| `activerecord-lifecycle-hook-semantics-audit`                          | 450     | skips       |
| `activerecord-test-fixtures-method-missing-accessors`                  | 300     | skips       |
| `activerecord-converge-alias-tracker-hash-default`                     | 100     | calls-args  |
| `activerecord-converge-preloader-through-reduce-merge`                 | 120     | calls-args  |
| `activerecord-converge-inheritance-find-sti-class-rows`                | 250     | calls-args  |
| `activerecord-converge-insert-all-builder-rows`                        | 200     | calls-args  |
| `activerecord-converge-mysql2-cast-result-args`                        | 200     | calls-args  |
| `activerecord-converge-load-from-sql-instantiate-instance-of`          | 150     | calls-args  |
| `activerecord-converge-build-where-clause-constructor-order`           | 150     | calls-args  |
| `activerecord-converge-statement-cache-execute-async-arm`              | 200     | calls-args  |
| `activerecord-converge-type-caster-connection-with-connection`         | 120     | calls-args  |
| `activerecord-converge-sqlite3-reconnect-rollback`                     | 100     | calls-args  |
| `activerecord-verify-and-pin-protocol-bodies`                          | 250     | pins        |
| `activerecord-verify-and-pin-migration-compatibility`                  | 150     | pins        |
| `activerecord-option-keys-missing-in-ts`                               | 150     | calls-args  |
| `activerecord-deps-lint-to-zero`                                       | 400     | api-surface |
| `activerecord-triage-structural-duplicates-of-ruby-compat`             | 400     | tooling     |
| `parity-100-rehome-postponed-rfc-dependencies`                         | 20      | tooling     |
| `activerecord-api-parity-100-close-out`                                | 200     | closeout    |

## Blocked

The two stories this section named, `activerecord-fixture-initialize-prepend-constructor` and
`activerecord-port-trilogy-adapter`, moved to RFC 0183; the trilogy one is closed, decided not ported
(trails CLAUDE.md § "Trilogy is out of scope"), and the other keeps its blocker. The blocked
stories still here are unclustered surfaced deviations; `pnpm tasks list --rfc
0174-activerecord-api-parity-100 --status blocked` lists them with their blockers.

## Split: RFC 0178

As of 2026-10-02 the three report-only **body-shape** axes are owned by
`0178-activerecord-arms-parity-100`: the arms report (`pnpm parity:api:arms:report`), void returns
(`pnpm parity:api:returns`) and duck-type guards (`pnpm parity:api:duck-types`). The 53 stories of this
RFC's `arms` cluster moved there, done ones included, so the prior art sits beside the open work. Slugs
did not change, so every `deps` entry and citation still resolves.

| The row a story deletes is in                                                    | File it in |
| -------------------------------------------------------------------------------- | ---------- |
| `parity:api:arms:report`, `parity:api:returns` or `parity:api:duck-types`        | RFC 0178   |
| the extractor or fold behind those three reports (`scripts/api-compare/`)        | RFC 0178   |
| `parity:api:arms:throws`, `:blocks`, `:parents` (gated, owned by RFCs 0127/0156) | here       |
| any other axis in § "Baseline"                                                   | here       |

A story that deletes rows on two axes goes where its first acceptance criterion points.
`quoted-date-usec-arm-is-relocated-into-sql-datetime` names an arms row and at first stayed here, because
`sql-datetime-formatters-fold-into-quoted-date-and-quoted-time` depended on it. That story moved to RFC 0180
on 2026-10-06, so the arms story moved to RFC 0178 on the same day.

`activerecord-api-parity-100-close-out` still re-measures those three axes. It keeps a story-level `deps`
edge on each moved story it already named. After the split merges, those edges are replaced by one
`deps-rfc` edge on RFC 0178 (`tasks set-deps-rfc`), which is the whole-RFC case § "Gating" describes: the
close-out waits until 0178 is closed, including stories filed there later.

## Split: RFC 0179

As of 2026-10-02 a story whose fix is a rule in the comparer itself is owned by
`0179-api-compare-crediting-rules`: the call-set gate, the call-argument gate, the extra-surface scorer and
the advisory reports (option keys, literals, structural duplicates), all under `scripts/api-compare/`. 22
stories moved there, 20 of them open. Slugs did not change, so every `CONVERGEABLE <story-id>` receipt in trails still
resolves.

| The story's first acceptance criterion changes                                                  | File it in |
| ----------------------------------------------------------------------------------------------- | ---------- |
| the comparer (`scripts/api-compare/`, `scripts/parity/`), so a correct port stops being flagged | RFC 0179   |
| the arms, void-return or duck-type extractor                                                    | RFC 0178   |
| a port under `packages/*/src`, a skip group, an exclude file or a baseline row                  | here       |

This is the principle "Measurement faults are fixed in the tool" given its own backlog. A story that both
ports and re-scores (`compatibility-module-members-unmeasured-by-parity-api`) stays here, because its first
criterion is the port. The two `*-score-against-the-*-gem` stories stayed for the same reason until
2026-10-06, when they moved to RFC 0180 because trails receipts name them.

`activerecord-api-parity-100-close-out` named two of the moved stories in `deps`. As with RFC 0178, those
edges are replaced after merge by one `deps-rfc` edge on RFC 0179.

## Split: RFCs 0180 to 0183

As of 2026-10-06 four more axes have their own RFC. 132 stories moved, done ones included, so the prior
art sits beside the open work. Slugs did not change, so every `deps` entry and every
`CONVERGEABLE <story-id>` receipt in trails still resolves.

| RFC                                       | Owns                                                             | Stories | Open | Open est-loc |
| ----------------------------------------- | ---------------------------------------------------------------- | ------- | ---- | ------------ |
| `0180-activerecord-receipt-parity`        | PERMANENT audits, CONVERGEABLE receipts, audit findings          | 89      | 73   | 15,370       |
| `0181-activerecord-member-placement`      | inlined module bodies, `parity:api:moves`                        | 16      | 14   | 5,370        |
| `0182-activerecord-error-parity`          | error class / message / raise site, the two eslint exclude files | 13      | 13   | 3,060        |
| `0183-activerecord-excluded-source-files` | `.rb` files on `scripts/parity/unported-files/`                  | 14      | 11   | 2,680        |

| The story's first acceptance criterion                                                                                                   | File it in |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| moves a member into the file mirroring the `.rb` that defines it (`inlined-from`, `parity:api:moves`)                                    | RFC 0181   |
| changes an error class, message or raise site, or deletes an error-parity / callback-invocations exclude row                             | RFC 0182   |
| ports or un-excludes a `.rb` listed in `scripts/parity/unported-files/`                                                                  | RFC 0183   |
| deletes a receipt in `packages/activerecord/src`; or a `CONVERGEABLE <story-id>` receipt names the story; or a receipt audit surfaced it | RFC 0180   |
| deletes a row of the arms, void-return or duck-type report                                                                               | RFC 0178   |
| changes a test file, test model, fixture or the test schema                                                                              | RFC 0175   |
| any other activerecord source-side axis                                                                                                  | here       |

The rows are read top to bottom and the first match wins.

Three stories went to RFCs that already existed, by the same table:
`quoted-date-usec-arm-is-relocated-into-sql-datetime` to RFC 0178 (it owns a row of the missing-arm
report), and `test-databases-tests-mirror-rails-hash-configurations` and
`admin-test-models-derive-table-name-from-the-module-prefix` to RFC 0175 (each changes a test file or a
test model). Nothing went to RFC 0179: it is closed, and a story in a closed RFC is never claimable.

`activerecord-api-parity-100-close-out` named 46 of the moved stories in `deps`. Those entries are
replaced by four `deps-rfc` edges, one per new RFC, which is the whole-RFC case § "Gating" describes. The
edit is in the split's own diff: the RFCs exist in the same commit, so nothing is owed after merge. The
close-out now holds 71 story-level `deps` and six `deps-rfc` edges (0178, 0179, 0180, 0181, 0182, 0183).

## Non-goals

- **Rewriting the parity tools' scoring model.** Where a tool is wrong, the owning story fixes that one
  fault with a test; broader tooling redesign stays in RFCs 0127 / 0156.
- **Ratifying new CLAUDE.md sections.** A story that finds a genuine language shortcoming is filed
  `blocked` with the blocker; deciding to ratify is a separate, explicit decision.
- **`no-explicit-any` allowlists.** They are type-hygiene registers, not parity axes.
- **Other packages.** activesupport, actionpack, trailties and ruby-compat have their own parity RFCs;
  ruby-compat work appears here only where an activerecord/activemodel/arel row needs a carrier.

- **activerecord's test-side axes.** RFC 0175.

## Alternatives considered

- **One activerecord RFC.** Rejected: 127 + 38 stories in one README
  approaches the 2,000-line cap, and source vs test work touches disjoint files, so two RFCs claim independently.
- **Per-axis RFCs across the three packages.** Rejected: most stories touch one package's files, and a
  package-scoped RFC can close and pin its gates on its own.
- **Seeding the arms and moves stories after their tooling fixes.** Rejected: the residue would then have
  no owner. The stories carry today's full row lists and depend on the tooling story; each extractor fix a
  story lands shrinks the later ones.

## Rollout

1. **Rehome and tooling** — `activerecord-triage-structural-duplicates-of-ruby-compat`, `parity-100-rehome-postponed-rfc-dependencies` (the two comparer-fault stories moved to RFC 0179 on 2026-10-02)
2. **API surface** — `activerecord-port-associations-eager-load-bang`, `activerecord-deduplicable-deduplicated-and-unary-minus`, `activerecord-core-attributes-for-inspect`, `activerecord-encryption-contexts-thread-mattr-accessors`, `activerecord-extended-deterministic-queries-core-queries-find-by`, `activerecord-relation-encode-with-and-strict-loading-scope`, `activerecord-delegation-encode-with-and-class-specific-relation-name`, `activerecord-result-indexed-row-to-h`, `activerecord-type-registry-copy-and-serialized-inspect`, `activerecord-inheritance-residue-delegate-class-supers`, `activerecord-disable-joins-association-scope-add-constraints-arity`, `activerecord-deps-lint-to-zero`
3. **Skips** — `activerecord-retire-migrator-index-helpers-skip`, `activerecord-retire-check-pending-skip`, `activerecord-retire-class-attribute-slot-skip`, `activerecord-retire-no-touching-klasses-skip`, `activerecord-score-core-object-protocol-names`, `activerecord-lifecycle-hook-semantics-audit`, `activerecord-test-fixtures-method-missing-accessors`. Excluded files moved to RFC 0183 on 2026-10-06.
4. **Calls and args** — `activerecord-converge-alias-tracker-hash-default`, `activerecord-converge-preloader-through-reduce-merge`, `activerecord-converge-inheritance-find-sti-class-rows`, `activerecord-converge-insert-all-builder-rows`, `activerecord-converge-mysql2-cast-result-args`, `activerecord-converge-load-from-sql-instantiate-instance-of`, `activerecord-converge-build-where-clause-constructor-order`, `activerecord-converge-statement-cache-execute-async-arm`, `activerecord-converge-type-caster-connection-with-connection`, `activerecord-converge-sqlite3-reconnect-rollback`, `activerecord-option-keys-missing-in-ts`
5. **Receipts** — moved to RFC 0180 on 2026-10-06; see its § "Rollout".
6. **Pins** — `activerecord-verify-and-pin-protocol-bodies`, `activerecord-verify-and-pin-migration-compatibility`. Error parity moved to RFC 0182 on 2026-10-06.
7. **Placement** — moved to RFC 0181 on 2026-10-06; see its § "Rollout".
8. **Arms** — moved to RFC 0178 (`0178-activerecord-arms-parity-100`) on 2026-10-02; see its § "Rollout".
9. **Close-out** — `activerecord-api-parity-100-close-out` (waits on RFCs 0178, 0179 and 0180 to 0183 through `deps-rfc`)

## Verification

`activerecord-api-parity-100-close-out`'s acceptance criteria are the verification — every § "Baseline"
row at target on a clean build, with the named blocked residue:
`activerecord-fixture-initialize-prepend-constructor` (constructor splicing), now in RFC 0183, and two
decided exclusions: trilogy (`activerecord-port-trilogy-adapter`, closed — trails CLAUDE.md § "Trilogy is
out of scope") and `promise.rb` (trails#8342). Both stay on the unported list with the decision cited in
their entries. The close-out is the single re-measuring gate for RFCs 0178 and 0180 to 0183 as well:
none of them has a close-out of its own.

## Open questions

1. **Should activerecord's surfaced deviations get their own bucket RFC?** Still deferred, and now the
   largest thing here: 131 unclustered stories, 106 of them open (10,635 est-loc), share no register and no
   mechanism. The 2026-10-06 split routed out the ones a receipt, a placement report, an error rule or the
   unported list owns, and left the rest.
2. **Is the `then` skip on `Relation`/`FutureResult` ratified?** Resolved: yes, by § "`Relation` is evaluated
   by an async query"; it survives as a scoped, cited entry.

## Changelog

- 2026-09-30: initial RFC (127 stories, 46,290 est-loc).
- 2026-10-02: split. The `arms` cluster (control-flow arms, void returns, duck-type guards) moved to
  `0178-activerecord-arms-parity-100`: 53 stories, 45 of them open (17,848 est-loc). 266 stay here,
  219 of them open (39,465 est-loc). The routing rule is § "Split: RFC 0178"; the analysis of the seam
  is in 0178 § "Alternatives considered".
- 2026-10-02: second split. 22 comparer-rule stories (20 open, 2,850 est-loc) moved to
  `0179-api-compare-crediting-rules`; 244 stay here, 198 of them open (36,555 est-loc). The routing rule is
  § "Split: RFC 0179". `activerecord-api-parity-100-close-out`'s `deps` list was rewritten from a wrapped
  flow sequence to a block list, with no entry changed, because `tasks set-deps` refuses the wrapped form.
- 2026-10-06: third split, four RFCs at once. 132 stories moved: 89 to `0180-activerecord-receipt-parity`
  (the `receipts` cluster and 30 unclustered stories), 16 to `0181-activerecord-member-placement`, 13 to
  `0182-activerecord-error-parity` and 14 to `0183-activerecord-excluded-source-files`. Three more went to
  RFCs that already existed: one to 0178 and two to 0175. 166 stay here, 127 of them open (15,275 est-loc).
  The routing rule is § "Split: RFCs 0180 to 0183". The close-out's 46 story-level `deps` on moved stories
  became four `deps-rfc` edges in the same diff. Summary and title re-scoped to what remains.
