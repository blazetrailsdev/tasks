---
rfc: "0174-activerecord-api-parity-100"
title: "activerecord source at 100% on every parity axis"
status: active
created: 2026-09-30
updated: 2026-09-30
owner: "@deanmarano"
packages:
  - "activerecord"
  - "ruby-compat"
clusters:
  - api-surface
  - arms
  - calls-args
  - closeout
  - errors
  - excluded-files
  - pins
  - placement
  - receipts
  - skips
  - tooling
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
priority: 2
---

# RFC 0174 — activerecord source at 100% on every parity axis

## Summary

activerecord is the largest port and carries most of the residue: 58 name misses, 8 inheritance and 1
arity mismatch, 13 excluded source files, 45 non-ratified skipped definitions, 61 call/args baseline
rows, ~60 CONVERGEABLE receipts that name no story, 417 PERMANENT receipts nobody has checked against
CLAUDE.md, 76 unpinned bodies, 128 module bodies inlined into their hosts, 947 moves, ~1,030 arm rows,
51 void returns, 74 files grandfathered by `rails-error-parity`. This RFC covers the **source-side**
axes; RFC 0175 covers tests, assertions, fixtures and schema. **127 stories, 46,290
est-loc.**

Note: there is no `activerecord-surfaced-deviations` bucket — activerecord's surfaced deviations still
live in the retired RFC 0023 (319 activerecord drafts). The ones RFCs 0172–0175 depend on, together with
those in the postponed RFCs 0025 and 0082, are rehomed by `parity-100-rehome-postponed-rfc-dependencies`.

## Motivation

### Baseline

Measured 2026-09-30 on trails `main` @ `ea7d456048` after a clean `pnpm build`, with `pnpm parity:api` (+ `--calls`), `parity:api:calls`, `:calls:args`, `:params`, `:predicates`, `:extra`/`:extra:gate`, `:arms:throws`, `:arms:report`, `:blocks`, `:parents`, `:pins`, `:receipts:gate`, `:moves`, `:returns`, `:duck-types`, `:deps`, `parity:structural-duplicates:report`, `parity:test` (+ `--missing`), `parity:test:assertions`, `parity:fixtures`, `parity:schema`, and a grep of `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` / `@missingRailsName` receipts in `packages/<pkg>/src`.

| Axis                                                                       | Now                                                                                                     | Target                        | Where the residue lives                                                                                                 | Stories                                                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `parity:api` methods                                                       | 6789/6847 (99.2%)                                                                                       | 100%                          | 23 files; largest `migration/compatibility.rb` 18, `postgresql_adapter.rb` 6, `encryption/contexts.rb` 6                | `api-surface` cluster + RFC 0156/0155 deps                                                                                |
| files                                                                      | 288/288                                                                                                 | hold                          | —                                                                                                                       | —                                                                                                                         |
| inheritance                                                                | 209/217                                                                                                 | 100%                          | 5 `DelegateClass` supers, 2 `TypeMetadata`, `OID::DateTime`                                                             | `activerecord-inheritance-residue-delegate-class-supers`                                                                  |
| arity                                                                      | 3730/3731                                                                                               | 100%                          | `disable_joins_association_scope.rb#add_constraints`                                                                    | `activerecord-disable-joins-association-scope-add-constraints-arity`                                                      |
| params / predicates                                                        | 2480/2480, 0                                                                                            | hold                          | —                                                                                                                       | —                                                                                                                         |
| excluded source files                                                      | 13 (152 defs)                                                                                           | trilogy only (blocked)        | `unported-files/unscoped.ts`                                                                                            | `excluded-files` cluster, `port-destroy-association-async-job` (RFC 0116)                                                 |
| global skip (non-ratified)                                                 | `SKIP_GROUPS` 0/7/8/9/10: 45 defs incl. `ModelSchema.load_schema!`, `Association#target`                | 0                             | `scripts/parity/conventions.ts`                                                                                         | `skips` cluster                                                                                                           |
| global skip (ratified hooks)                                               | 31 (`method_missing` family 17, lifecycle hooks 14)                                                     | ratified only, bodies audited | `SKIP_GROUPS[3]`/`[4]`/`[5]`                                                                                            | `activerecord-lifecycle-hook-semantics-audit`, `activerecord-test-fixtures-method-missing-accessors`                      |
| scoped skip                                                                | `SCOPED_SKIP_GROUPS[11]` (`-@`, 5 files) and `[15]` (`Fixture#initialize`, 2 files)                     | 0                             | `SCOPED_SKIP_GROUPS[11]`, `[15]`                                                                                        | `activerecord-deduplicable-deduplicated-and-unary-minus`, `activerecord-fixture-initialize-prepend-constructor` (blocked) |
| body pins                                                                  | 4468/4544 (76)                                                                                          | 100%                          | 59 protocol defs + 17 `compatibility.rb`                                                                                | `pins` cluster                                                                                                            |
| `parity:api:calls` rows                                                    | 53 (133 unreviewed repo-wide)                                                                           | 0                             | 30 shards                                                                                                               | 10 stories + `converge-same-name-second-owner-call-rows`, `burn-down-rfc0126-repairing-surfaced-call-rows`                |
| `parity:api:calls:args` shape rows                                         | 8                                                                                                       | 0                             | alias-tracker, preloader/through ×2, mysql2, inheritance, insert-all, calculations ×2                                   | `calls-args` cluster                                                                                                      |
| naming rows                                                                | 0 (60 `@missingRailsName` PERMANENT)                                                                    | ratified only                 | —                                                                                                                       | PERMANENT audits                                                                                                          |
| `parity:api:extra:gate`                                                    | rowless (novel 0 / total 0)                                                                             | hold                          | —                                                                                                                       | —                                                                                                                         |
| extra: inlined module bodies (report-only)                                 | 128                                                                                                     | 0, then gated                 | `base.ts` ← callbacks/core/persistence/…, `relation.ts` ← query_methods, `postgresql-adapter.ts` ← pg schema_statements | `placement` cluster, `activerecord-inlined-bodies-report-becomes-a-gate`                                                  |
| CONVERGEABLE receipts naming a story                                       | 44                                                                                                      | converge via their stories    | 20 stories in RFCs 0023/0082/0123/0155                                                                                  | close-out deps                                                                                                            |
| CONVERGEABLE receipts naming **no** story                                  | 60                                                                                                      | 0                             | `command-recorder.ts` 18, `test-adapter.ts`, `inheritance.ts`, `model-schema.ts`, …                                     | `activerecord-converge-*-convergeable-receipts`                                                                           |
| PERMANENT receipts                                                         | 417 (136 `@noRailsEquivalent`, 194 `@missingRailsCall`, 27 `@missingRailsArgs`, 60 `@missingRailsName`) | ratified only                 | all directories                                                                                                         | 10 `activerecord-audit-permanent-receipts-*`                                                                              |
| `parity:api:arms:throws` / `:blocks` / `:parents`                          | 0 / 9 / 3                                                                                               | 0 / 0 / 0                     | blocks: `relation/batches.rb`, `base.rb`, …; parents: `Base`, `Calculations`, `InstanceMethods`                         | `converge-activerecord-dropped-block-arms-remainder`, `burn-down-the-ambiguous-parent-remainder`                          |
| arms report                                                                | 129 missing / 903 invented pairs (2,109 invented tokens)                                                | 0                             | everywhere                                                                                                              | `arms` cluster + `activerecord-gate-report-only-arm-tokens`                                                               |
| `parity:api:moves`                                                         | 947                                                                                                     | 0                             | mostly include-chain double counting                                                                                    | `activerecord-converge-moves-residue-*`                                                                                   |
| `parity:api:returns` / `:duck-types`                                       | 51 / 8                                                                                                  | 0                             | adapters, schema statements, tasks                                                                                      | `activerecord-converge-void-returns-*`, `activerecord-duck-type-instanceof-to-respond-to`                                 |
| `parity:api:deps`                                                          | → arel 3+1, → activemodel 10+1, → activesupport 7 ✗                                                     | 0                             | `insert-all.ts`, `attributes.ts`, `migration.ts`, …                                                                     | `activerecord-deps-lint-to-zero`                                                                                          |
| option keys (advisory)                                                     | 46 (3 likely-real)                                                                                      | 0                             | schema definitions/statements                                                                                           | `activerecord-option-keys-*`                                                                                              |
| literals (advisory)                                                        | 1                                                                                                       | 0                             | `sanitization.rb` `escape_character` (normalizer fault)                                                                 | `activerecord-literal-normalizer-backslash-escapes`                                                                       |
| protocol-call enrollment                                                   | activerecord not in `PROTOCOL_CALL_ENROLLED_PACKAGES` (46 rows)                                         | enrolled                      | —                                                                                                                       | `enroll-activerecord-in-protocol-call-mapping` (RFC 0156)                                                                 |
| structural duplicates (report) / `no-ruby-compat-reimplementation-exclude` | 131 / 2                                                                                                 | 0 / 0                         | —                                                                                                                       | `activerecord-triage-structural-duplicates-of-ruby-compat`                                                                |
| `rails-error-parity-exclude.json`                                          | 74 activerecord files                                                                                   | 0                             | all directories                                                                                                         | `activerecord-burn-rails-error-parity-exclude-*`                                                                          |
| `rails-callback-invocations-exclude.json`                                  | 5                                                                                                       | 0                             | `callbacks.ts`, `core.ts`, `transactions.ts`                                                                            | `activerecord-burn-rails-callback-invocations-exclude`                                                                    |
| `arity-exclude.json` / `inheritance-exclude.json`                          | 0 / 0                                                                                                   | hold                          | —                                                                                                                       | `promote-arity-mismatches-to-ratchet` (RFC 0127) gates it                                                                 |

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
- The eight `activerecord-relocate-*` stories precede `activerecord-inlined-bodies-report-becomes-a-gate`,
  which precedes the base-hosted moves story (the inlined bodies are a subset of the base-hosted moves).
- Each invented-arm story depends on the missing-arm story of the same area, so the branch structure is
  restored before invented guards are removed.
- `parity-100-rehome-postponed-rfc-dependencies` runs first after merge (see § "Gating").

### Gating: why `status: active`, and why `deps-rfc` is empty

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
- **`deps-rfc` is left empty on purpose.** It means "until that RFC is **closed**" (`claimable()`:
  `s.deps_rfc.some((d) => rfcStatus.get(d) !== "closed")`), not "until it is active". Setting it to a draft
  RFC would hold a story until that entire RFC finished, long after the one story it needs has landed.
  Existing uses (`0019-canonical-schema-burndown`, `0063-async-validation-chain`) are that whole-RFC case.

### Existing stories this RFC depends on

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
| `audit-loop-try-rescue-arm-strata-for-gating`                             | 0127 (draft)     | draft        | `activerecord-gate-report-only-arm-tokens`                                                                                                                                                                       |
| `pg-translate-exception-respond-to-result`                                | 0082 (postponed) | draft        | `activerecord-duck-type-instanceof-to-respond-to`                                                                                                                                                                |
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

| Story                                                                                    | est-loc | Cluster        |
| ---------------------------------------------------------------------------------------- | ------- | -------------- |
| `activerecord-port-associations-eager-load-bang`                                         | 80      | api-surface    |
| `activerecord-deduplicable-deduplicated-and-unary-minus`                                 | 250     | api-surface    |
| `activerecord-core-attributes-for-inspect`                                               | 100     | api-surface    |
| `activerecord-encryption-contexts-thread-mattr-accessors`                                | 180     | api-surface    |
| `activerecord-extended-deterministic-queries-core-queries-find-by`                       | 100     | api-surface    |
| `activerecord-relation-encode-with-and-strict-loading-scope`                             | 180     | api-surface    |
| `activerecord-delegation-encode-with-and-class-specific-relation-name`                   | 120     | api-surface    |
| `activerecord-result-indexed-row-to-h`                                                   | 60      | api-surface    |
| `activerecord-type-registry-copy-and-serialized-inspect`                                 | 100     | api-surface    |
| `activerecord-inheritance-residue-delegate-class-supers`                                 | 250     | api-surface    |
| `activerecord-disable-joins-association-scope-add-constraints-arity`                     | 200     | api-surface    |
| `activerecord-port-version-and-gem-version`                                              | 80      | excluded-files |
| `activerecord-unexclude-dynamic-matchers`                                                | 150     | excluded-files |
| `activerecord-unexclude-and-measure-fixtures-rb`                                         | 500     | excluded-files |
| `activerecord-fixture-initialize-prepend-constructor` (blocked)                          | 250     | excluded-files |
| `activerecord-port-encrypted-fixtures-module`                                            | 150     | excluded-files |
| `activerecord-port-marshalling-module`                                                   | 250     | excluded-files |
| `activerecord-port-message-pack-module`                                                  | 350     | excluded-files |
| `activerecord-port-promise`                                                              | 250     | excluded-files |
| `activerecord-port-railties-controller-runtime`                                          | 250     | excluded-files |
| `activerecord-port-legacy-yaml-adapter-and-yaml-column`                                  | 250     | excluded-files |
| `activerecord-port-trilogy-adapter` (blocked)                                            | 650     | excluded-files |
| `activerecord-retire-migrator-index-helpers-skip`                                        | 350     | skips          |
| `activerecord-retire-check-pending-skip`                                                 | 350     | skips          |
| `activerecord-retire-class-attribute-slot-skip`                                          | 350     | skips          |
| `activerecord-retire-no-touching-klasses-skip`                                           | 120     | skips          |
| `activerecord-score-core-object-protocol-names`                                          | 300     | skips          |
| `activerecord-lifecycle-hook-semantics-audit`                                            | 450     | skips          |
| `activerecord-test-fixtures-method-missing-accessors`                                    | 300     | skips          |
| `activerecord-converge-alias-tracker-hash-default`                                       | 100     | calls-args     |
| `activerecord-converge-preloader-through-reduce-merge`                                   | 120     | calls-args     |
| `activerecord-converge-inheritance-find-sti-class-rows`                                  | 250     | calls-args     |
| `activerecord-converge-insert-all-builder-rows`                                          | 200     | calls-args     |
| `activerecord-converge-mysql2-cast-result-args`                                          | 200     | calls-args     |
| `activerecord-converge-load-from-sql-instantiate-instance-of`                            | 150     | calls-args     |
| `activerecord-converge-build-where-clause-constructor-order`                             | 150     | calls-args     |
| `activerecord-converge-statement-cache-execute-async-arm`                                | 200     | calls-args     |
| `activerecord-converge-type-caster-connection-with-connection`                           | 120     | calls-args     |
| `activerecord-converge-sqlite3-reconnect-rollback`                                       | 100     | calls-args     |
| `activerecord-converge-command-recorder-inverse-table-methods`                           | 400     | receipts       |
| `activerecord-converge-test-infra-convergeable-receipts`                                 | 450     | receipts       |
| `activerecord-converge-inheritance-convergeable-receipts`                                | 350     | receipts       |
| `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`                | 500     | receipts       |
| `activerecord-converge-configuration-and-connection-convergeable-receipts`               | 250     | receipts       |
| `activerecord-converge-reflection-nested-enum-store-convergeable-receipts`               | 300     | receipts       |
| `activerecord-converge-selector-middleware-convergeable-receipts`                        | 200     | receipts       |
| `activerecord-converge-dumper-adapter-sqlite-encryption-convergeable-receipts`           | 350     | receipts       |
| `activerecord-audit-permanent-receipts-root-a-m`                                         | 500     | receipts       |
| `activerecord-audit-permanent-receipts-root-n-z`                                         | 500     | receipts       |
| `activerecord-audit-permanent-receipts-relation-part-1`                                  | 500     | receipts       |
| `activerecord-audit-permanent-receipts-relation-part-2`                                  | 500     | receipts       |
| `activerecord-audit-permanent-receipts-associations`                                     | 500     | receipts       |
| `activerecord-audit-permanent-receipts-subsystems-part-1`                                | 500     | receipts       |
| `activerecord-audit-permanent-receipts-subsystems-part-2`                                | 500     | receipts       |
| `activerecord-audit-permanent-receipts-ca-root`                                          | 500     | receipts       |
| `activerecord-audit-permanent-receipts-ca-abstract`                                      | 500     | receipts       |
| `activerecord-audit-permanent-receipts-ca-drivers`                                       | 500     | receipts       |
| `activerecord-verify-and-pin-protocol-bodies`                                            | 250     | pins           |
| `activerecord-verify-and-pin-migration-compatibility`                                    | 150     | pins           |
| `activerecord-option-keys-missing-in-ts`                                                 | 150     | calls-args     |
| `activerecord-option-keys-extra-arm-measures-read-keys`                                  | 250     | tooling        |
| `activerecord-literal-normalizer-backslash-escapes`                                      | 120     | tooling        |
| `activerecord-relocate-query-methods-bodies-inlined-in-relation`                         | 600     | placement      |
| `activerecord-relocate-callbacks-bodies-inlined-in-base`                                 | 450     | placement      |
| `activerecord-relocate-pg-schema-statements-bodies-inlined-in-adapter`                   | 550     | placement      |
| `activerecord-relocate-core-bodies-inlined-in-base`                                      | 400     | placement      |
| `activerecord-relocate-persistence-model-schema-counter-cache-bodies`                    | 450     | placement      |
| `activerecord-relocate-remaining-base-hosted-inlined-bodies`                             | 450     | placement      |
| `activerecord-relocate-adapter-hosted-inlined-bodies`                                    | 350     | placement      |
| `activerecord-relocate-relation-type-and-association-inlined-bodies`                     | 300     | placement      |
| `activerecord-inlined-bodies-report-becomes-a-gate`                                      | 150     | placement      |
| `activerecord-converge-moves-residue-base-hosted`                                        | 500     | placement      |
| `activerecord-converge-moves-residue-relation-hosted`                                    | 500     | placement      |
| `activerecord-converge-moves-residue-adapter-hosted`                                     | 500     | placement      |
| `activerecord-converge-moves-residue-rest`                                               | 300     | placement      |
| `activerecord-converge-missing-control-flow-arms-root`                                   | 600     | arms           |
| `activerecord-converge-missing-control-flow-arms-connection-adapters-part-1`             | 600     | arms           |
| `activerecord-converge-missing-control-flow-arms-connection-adapters-part-2`             | 600     | arms           |
| `activerecord-converge-missing-control-flow-arms-associations`                           | 360     | arms           |
| `activerecord-converge-missing-control-flow-arms-relation`                               | 432     | arms           |
| `activerecord-converge-missing-control-flow-arms-subsystems`                             | 600     | arms           |
| `activerecord-gate-report-only-arm-tokens`                                               | 200     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-a-f-part-1`                       | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-a-f-part-2`                       | 536     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-a-f-part-3`                       | 542     | arms           |
| `activerecord-converge-invented-control-flow-arms-associations-part-1`                   | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-associations-part-2`                   | 554     | arms           |
| `activerecord-converge-invented-control-flow-arms-associations-part-3`                   | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-associations-part-4`                   | 542     | arms           |
| `activerecord-converge-invented-control-flow-arms-associations-part-5`                   | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-subsystems-part-1`                     | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-subsystems-part-2`                     | 518     | arms           |
| `activerecord-converge-invented-control-flow-arms-subsystems-part-3`                     | 194     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1`       | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-2`       | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-3`       | 140     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-1`   | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-2`   | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-3`   | 380     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-mysql-sqlite3`     | 356     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-1` | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-2` | 374     | arms           |
| `activerecord-converge-invented-control-flow-arms-encryption-part-1`                     | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-encryption-part-2`                     | 374     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-g-p-part-1`                       | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-g-p-part-2`                       | 542     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-g-p-part-3`                       | 278     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-q-z-part-1`                       | 554     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-q-z-part-2`                       | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-root-q-z-part-3`                       | 458     | arms           |
| `activerecord-converge-invented-control-flow-arms-relation-part-1`                       | 536     | arms           |
| `activerecord-converge-invented-control-flow-arms-relation-part-2`                       | 560     | arms           |
| `activerecord-converge-invented-control-flow-arms-relation-part-3`                       | 254     | arms           |
| `activerecord-converge-invented-control-flow-arms-tasks-part-1`                          | 536     | arms           |
| `activerecord-converge-invented-control-flow-arms-tasks-part-2`                          | 170     | arms           |
| `activerecord-converge-void-returns-adapters`                                            | 400     | arms           |
| `activerecord-converge-void-returns-models-and-tasks`                                    | 300     | arms           |
| `activerecord-duck-type-instanceof-to-respond-to`                                        | 250     | arms           |
| `activerecord-deps-lint-to-zero`                                                         | 400     | api-surface    |
| `activerecord-triage-structural-duplicates-of-ruby-compat`                               | 400     | tooling        |
| `activerecord-burn-rails-error-parity-exclude-root`                                      | 600     | errors         |
| `activerecord-burn-rails-error-parity-exclude-connection-adapters`                       | 600     | errors         |
| `activerecord-burn-rails-error-parity-exclude-associations-relation-encryption-tasks`    | 600     | errors         |
| `activerecord-burn-rails-error-parity-exclude-rest`                                      | 420     | errors         |
| `activerecord-burn-rails-callback-invocations-exclude`                                   | 250     | errors         |
| `parity-100-rehome-postponed-rfc-dependencies`                                           | 20      | tooling        |
| `activerecord-api-parity-100-close-out`                                                  | 200     | closeout       |

## Blocked

- `activerecord-fixture-initialize-prepend-constructor` — TS language: a JS class constructor cannot be wrapped after definition; ruby-compat prepend() wraps prototype methods only, and CLAUDE.md ratifies no constructor-splicing mechanism. Blocked with activemodel-api-initialize-concern-constructor on a ruby-compat construction hook.
- `activerecord-port-trilogy-adapter` — No JS/npm client for the trilogy C library exists; wrapping mysql2's npm driver under Rails' TrilogyAdapter name would invent a second Mysql2Adapter. Needs a trilogy-compatible JS client (ecosystem blocker, not a CLAUDE.md-ratified shortcoming).

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

1. **Rehome and tooling** — `activerecord-option-keys-extra-arm-measures-read-keys`, `activerecord-literal-normalizer-backslash-escapes`, `activerecord-triage-structural-duplicates-of-ruby-compat`, `parity-100-rehome-postponed-rfc-dependencies`
2. **API surface** — `activerecord-port-associations-eager-load-bang`, `activerecord-deduplicable-deduplicated-and-unary-minus`, `activerecord-core-attributes-for-inspect`, `activerecord-encryption-contexts-thread-mattr-accessors`, `activerecord-extended-deterministic-queries-core-queries-find-by`, `activerecord-relation-encode-with-and-strict-loading-scope`, `activerecord-delegation-encode-with-and-class-specific-relation-name`, `activerecord-result-indexed-row-to-h`, `activerecord-type-registry-copy-and-serialized-inspect`, `activerecord-inheritance-residue-delegate-class-supers`, `activerecord-disable-joins-association-scope-add-constraints-arity`, `activerecord-deps-lint-to-zero`
3. **Excluded files and skips** — `activerecord-port-version-and-gem-version`, `activerecord-unexclude-dynamic-matchers`, `activerecord-unexclude-and-measure-fixtures-rb`, `activerecord-fixture-initialize-prepend-constructor`, `activerecord-port-encrypted-fixtures-module`, `activerecord-port-marshalling-module`, `activerecord-port-message-pack-module`, `activerecord-port-promise`, `activerecord-port-railties-controller-runtime`, `activerecord-port-legacy-yaml-adapter-and-yaml-column`, `activerecord-port-trilogy-adapter`, `activerecord-retire-migrator-index-helpers-skip`, `activerecord-retire-check-pending-skip`, `activerecord-retire-class-attribute-slot-skip`, `activerecord-retire-no-touching-klasses-skip`, `activerecord-score-core-object-protocol-names`, `activerecord-lifecycle-hook-semantics-audit`, `activerecord-test-fixtures-method-missing-accessors`
4. **Calls and args** — `activerecord-converge-alias-tracker-hash-default`, `activerecord-converge-preloader-through-reduce-merge`, `activerecord-converge-inheritance-find-sti-class-rows`, `activerecord-converge-insert-all-builder-rows`, `activerecord-converge-mysql2-cast-result-args`, `activerecord-converge-load-from-sql-instantiate-instance-of`, `activerecord-converge-build-where-clause-constructor-order`, `activerecord-converge-statement-cache-execute-async-arm`, `activerecord-converge-type-caster-connection-with-connection`, `activerecord-converge-sqlite3-reconnect-rollback`, `activerecord-option-keys-missing-in-ts`
5. **Receipts** — `activerecord-converge-command-recorder-inverse-table-methods`, `activerecord-converge-test-infra-convergeable-receipts`, `activerecord-converge-inheritance-convergeable-receipts`, `activerecord-converge-schema-load-and-primary-key-convergeable-receipts`, `activerecord-converge-configuration-and-connection-convergeable-receipts`, `activerecord-converge-reflection-nested-enum-store-convergeable-receipts`, `activerecord-converge-selector-middleware-convergeable-receipts`, `activerecord-converge-dumper-adapter-sqlite-encryption-convergeable-receipts`, `activerecord-audit-permanent-receipts-root-a-m`, `activerecord-audit-permanent-receipts-root-n-z`, `activerecord-audit-permanent-receipts-relation-part-1`, `activerecord-audit-permanent-receipts-relation-part-2`, `activerecord-audit-permanent-receipts-associations`, `activerecord-audit-permanent-receipts-subsystems-part-1`, `activerecord-audit-permanent-receipts-subsystems-part-2`, `activerecord-audit-permanent-receipts-ca-root`, `activerecord-audit-permanent-receipts-ca-abstract`, `activerecord-audit-permanent-receipts-ca-drivers`
6. **Pins and error parity** — `activerecord-verify-and-pin-protocol-bodies`, `activerecord-verify-and-pin-migration-compatibility`, `activerecord-burn-rails-error-parity-exclude-root`, `activerecord-burn-rails-error-parity-exclude-connection-adapters`, `activerecord-burn-rails-error-parity-exclude-associations-relation-encryption-tasks`, `activerecord-burn-rails-error-parity-exclude-rest`, `activerecord-burn-rails-callback-invocations-exclude`
7. **Placement** — `activerecord-relocate-query-methods-bodies-inlined-in-relation`, `activerecord-relocate-callbacks-bodies-inlined-in-base`, `activerecord-relocate-pg-schema-statements-bodies-inlined-in-adapter`, `activerecord-relocate-core-bodies-inlined-in-base`, `activerecord-relocate-persistence-model-schema-counter-cache-bodies`, `activerecord-relocate-remaining-base-hosted-inlined-bodies`, `activerecord-relocate-adapter-hosted-inlined-bodies`, `activerecord-relocate-relation-type-and-association-inlined-bodies`, `activerecord-inlined-bodies-report-becomes-a-gate`, `activerecord-converge-moves-residue-base-hosted`, `activerecord-converge-moves-residue-relation-hosted`, `activerecord-converge-moves-residue-adapter-hosted`, `activerecord-converge-moves-residue-rest`
8. **Arms** — `activerecord-converge-missing-control-flow-arms-root`, `activerecord-converge-missing-control-flow-arms-connection-adapters-part-1`, `activerecord-converge-missing-control-flow-arms-connection-adapters-part-2`, `activerecord-converge-missing-control-flow-arms-associations`, `activerecord-converge-missing-control-flow-arms-relation`, `activerecord-converge-missing-control-flow-arms-subsystems`, `activerecord-gate-report-only-arm-tokens`, `activerecord-converge-invented-control-flow-arms-root-a-f-part-1`, `activerecord-converge-invented-control-flow-arms-root-a-f-part-2`, `activerecord-converge-invented-control-flow-arms-root-a-f-part-3`, `activerecord-converge-invented-control-flow-arms-associations-part-1`, `activerecord-converge-invented-control-flow-arms-associations-part-2`, `activerecord-converge-invented-control-flow-arms-associations-part-3`, `activerecord-converge-invented-control-flow-arms-associations-part-4`, `activerecord-converge-invented-control-flow-arms-associations-part-5`, `activerecord-converge-invented-control-flow-arms-subsystems-part-1`, `activerecord-converge-invented-control-flow-arms-subsystems-part-2`, `activerecord-converge-invented-control-flow-arms-subsystems-part-3`, `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-1`, `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-2`, `activerecord-converge-invented-control-flow-arms-connection-adapters-root-part-3`, `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-1`, `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-2`, `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-3`, `activerecord-converge-invented-control-flow-arms-connection-adapters-mysql-sqlite3`, `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-1`, `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-2`, `activerecord-converge-invented-control-flow-arms-encryption-part-1`, `activerecord-converge-invented-control-flow-arms-encryption-part-2`, `activerecord-converge-invented-control-flow-arms-root-g-p-part-1`, `activerecord-converge-invented-control-flow-arms-root-g-p-part-2`, `activerecord-converge-invented-control-flow-arms-root-g-p-part-3`, `activerecord-converge-invented-control-flow-arms-root-q-z-part-1`, `activerecord-converge-invented-control-flow-arms-root-q-z-part-2`, `activerecord-converge-invented-control-flow-arms-root-q-z-part-3`, `activerecord-converge-invented-control-flow-arms-relation-part-1`, `activerecord-converge-invented-control-flow-arms-relation-part-2`, `activerecord-converge-invented-control-flow-arms-relation-part-3`, `activerecord-converge-invented-control-flow-arms-tasks-part-1`, `activerecord-converge-invented-control-flow-arms-tasks-part-2`, `activerecord-converge-void-returns-adapters`, `activerecord-converge-void-returns-models-and-tasks`, `activerecord-duck-type-instanceof-to-respond-to`
9. **Close-out** — `activerecord-api-parity-100-close-out`

## Verification

`activerecord-api-parity-100-close-out`'s acceptance criteria are the verification — every § "Baseline"
row at target on a clean build, with the named blocked residue: `activerecord-port-trilogy-adapter`
(no JS trilogy client) and `activerecord-fixture-initialize-prepend-constructor` (constructor splicing).

## Open questions

1. **Should activerecord's surfaced deviations get their own bucket RFC?** Deferred: outside this RFC; the
   rehome story moves only the 0023 stories these RFCs depend on.
2. **Is the `then` skip on `Relation`/`FutureResult` ratified?** Resolved: yes, by § "`Relation` is evaluated
   by an async query"; it survives as a scoped, cited entry.

## Changelog

- 2026-09-30: initial RFC (127 stories, 46,290 est-loc).
