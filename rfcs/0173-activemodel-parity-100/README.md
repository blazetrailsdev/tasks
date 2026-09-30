---
rfc: "0173-activemodel-parity-100"
title: "activemodel at 100% on every parity axis"
status: active
created: 2026-09-30
updated: 2026-09-30
owner: "@deanmarano"
packages:
  - "activemodel"
clusters:
  - api-surface
  - arms
  - calls-args
  - closeout
  - pins
  - placement
  - receipts
  - skips
  - tests
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
  - "0174-activerecord-api-parity-100"
  - "0175-activerecord-test-parity-100"
priority: 2
---

# RFC — activemodel at 100% on every parity axis

## Summary

RFC 0131 took activemodel's name coverage near 100%; RFC 0134 drained its surfaced-deviations bucket.
What remains is spread across a dozen axes: 17 name misses, one arity mismatch, 7 call rows and 1 args
row, 76 PERMANENT and 1 CONVERGEABLE receipt, 25 extra-surface names in a package the extra gate does not
yet cover, 18 unpinned bodies, 7 dropped blocks, 1 missing raise, 91 arm rows, 150 moves, two scoped
skips, 8 skipped + 5 missing tests and 32 TS-only tests. **27 stories, 6,410 est-loc.**
Sibling of RFCs 0172, 0174, 0175.

## Motivation

### Baseline

Measured 2026-09-30 on trails `main` @ `ea7d456048` after a clean `pnpm build`, with `pnpm parity:api` (+ `--calls`), `parity:api:calls`, `:calls:args`, `:params`, `:predicates`, `:extra`/`:extra:gate`, `:arms:throws`, `:arms:report`, `:blocks`, `:parents`, `:pins`, `:receipts:gate`, `:moves`, `:returns`, `:duck-types`, `:deps`, `parity:structural-duplicates:report`, `parity:test` (+ `--missing`), `parity:test:assertions`, `parity:fixtures`, `parity:schema`, and a grep of `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` / `@missingRailsName` receipts in `packages/<pkg>/src`.

| Axis                                 | Now                                                                                                                          | Target                        | Where the residue lives                                                                                                   | Stories                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `parity:api` methods                 | 793/810 (97.9%)                                                                                                              | 100%                          | `naming.rb` 6, `type/value.rb` 5 (3 DeclOnly), `attribute.rb` 2, `error.rb` 2, `attribute_set.rb` 1, `type/registry.rb` 1 | `activemodel-port-type-value-limit-precision-scale-and-registry-copy` + RFC 0156 / 0082 deps                               |
| files / inheritance / params         | 67/67, 41/41, 336/336                                                                                                        | hold                          | —                                                                                                                         | close-out                                                                                                                  |
| arity                                | 451/452                                                                                                                      | 100%                          | `dirty.rb#init_attributes` (`super_` parameter)                                                                           | `activemodel-dirty-init-attributes-arity`                                                                                  |
| excluded file                        | 1 (`version.rb`)                                                                                                             | 0                             | `unported-files/unscoped.ts` `/version.rb`                                                                                | `activemodel-port-version-and-gem-version`                                                                                 |
| global skip (non-ratified)           | 4 (`freeze` ×3, `initialize_clone`)                                                                                          | 0                             | `SKIP_GROUPS[0]`                                                                                                          | `activemodel-score-core-object-freeze-and-initialize-clone`                                                                |
| global skip (ratified hooks)         | 9 (`included`/`extended`/`inherited` ×7, `method_missing`, `respond_to?`)                                                    | ratified only, bodies audited | `SKIP_GROUPS[3]`/`[4]`                                                                                                    | `activemodel-lifecycle-hook-semantics-audit`                                                                               |
| scoped skip                          | 2 (`naming.rb` `=~`/`!~`; `api.rb#initialize`)                                                                               | 0                             | `SCOPED_SKIP_GROUPS[0]`, `[14]`                                                                                           | `activemodel-name-match-operators`, `activemodel-api-initialize-concern-constructor` (blocked)                             |
| body pins                            | 519/537 (18)                                                                                                                 | 100%                          | protocol defs enrolled after the floor                                                                                    | `activemodel-verify-and-pin-protocol-bodies`                                                                               |
| `parity:api:calls` rows              | 7                                                                                                                            | 0                             | `attribute-methods` 3, `attribute-registration`, `secure-password`, `serializers/json`, `type/date`                       | `activemodel-converge-*-rows`                                                                                              |
| `parity:api:calls:args` shape rows   | 1                                                                                                                            | 0                             | `validations/comparability.json`                                                                                          | `activemodel-converge-registration-json-date-comparability-rows`                                                           |
| naming rows / `@missingRailsName`    | 0 / 8 PERMANENT                                                                                                              | ratified only                 | —                                                                                                                         | receipts audits                                                                                                            |
| `parity:api:params`, `:predicates`   | 0, 0                                                                                                                         | hold                          | —                                                                                                                         | —                                                                                                                          |
| extra surface (ungated)              | novel 1, moved 24, total 25 (+1 inlined)                                                                                     | 0, then gated rowless         | 18 files                                                                                                                  | `activemodel-burn-extra-surface-to-zero`, `activemodel-enroll-in-extra-surface-gate-rowless`                               |
| receipts                             | 54 `@noRailsEquivalent`, 6 `@missingRailsCall`, 8 `@missingRailsArgs`, 8 `@missingRailsName` — all PERMANENT; 1 CONVERGEABLE | ratified PERMANENT only       | 76 sites                                                                                                                  | `activemodel-audit-permanent-receipts-*`; the CONVERGEABLE one is `inline-is-mass-assignment-empty-into-assign-attributes` |
| `parity:api:arms:throws` mark        | 1                                                                                                                            | 0                             | `secure-password.ts`                                                                                                      | `activemodel-converge-secure-password-bcrypt-password`                                                                     |
| `parity:api:blocks` mark             | 7                                                                                                                            | 0                             | `attribute.rb`, `attribute_methods.rb`, `model.rb`, `validations.rb`, `validations/with.rb`                               | `activemodel-converge-dropped-block-arms`                                                                                  |
| arms report                          | 11 missing pairs, 80 invented pairs                                                                                          | 0                             | `type/` 29, root 30, `validations/` 16                                                                                    | `activemodel-converge-*-control-flow-arms*`                                                                                |
| option keys (advisory)               | 2                                                                                                                            | 0                             | `as_json`, `set_options_for_callback`                                                                                     | `activemodel-option-keys-to-zero`                                                                                          |
| `parity:api:moves`                   | 150                                                                                                                          | 0                             | include-chain double counting                                                                                             | `activemodel-converge-moves-residue`                                                                                       |
| `parity:api:returns` / `:duck-types` | 1 / 3                                                                                                                        | 0                             | `validator.ts#validate`; `error.ts`, `type/decimal.ts`, `validations/clusivity.ts`                                        | arms stories, `activemodel-duck-type-instanceof-to-respond-to`                                                             |
| `parity:test`                        | 1007/1020 (98.7%), 55/56 files, 8 skipped, 32 extra                                                                          | 100%, 0, 0                    | `railtie_test.rb` 0/5; mutation/dup skips; `validations/*` extras                                                         | `activemodel-*-tests`                                                                                                      |
| unported per-test entries            | 3 (Marshal ×2, Rails-6 YAML)                                                                                                 | 0                             | `attributes_test.rb`, `errors_test.rb`                                                                                    | `activemodel-port-marshal-and-yaml-error-tests`                                                                            |
| `parity:test:assertions`             | 0/0/0                                                                                                                        | hold                          | —                                                                                                                         | —                                                                                                                          |
| test population                      | `lint_test.rb` outside it                                                                                                    | enrolled                      | —                                                                                                                         | `test-compare-lint-and-serializers-json-mapping` (RFC 0123)                                                                |

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

### Existing stories this RFC depends on

| Existing story                                                            | RFC  | Status  | Needed by                                                                                |
| ------------------------------------------------------------------------- | ---- | ------- | ---------------------------------------------------------------------------------------- |
| `ruby-object-clone-dup-has-no-settled-trails-spelling`                    | 0023 | draft   | `activemodel-score-core-object-freeze-and-initialize-clone`                              |
| `delete-attribute-set-yaml-codec`                                         | 0170 | draft   | `activemodel-audit-permanent-receipts-subdirs`, `activemodel-burn-extra-surface-to-zero` |
| `override-of-inherited-rails-member-scores-moved`                         | 0120 | draft   | `activemodel-burn-extra-surface-to-zero`                                                 |
| `moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced` | 0127 | draft   | `activemodel-converge-moves-residue`                                                     |
| `attribute-set-fetch-value-tests-uninitialized-instead-of-yielding`       | 0082 | draft   | `activemodel-converge-dropped-block-arms`                                                |
| `clusivity-check-validity-duck-types-delimiter`                           | 0082 | draft   | `activemodel-duck-type-instanceof-to-respond-to`                                         |
| `ruby-mutable-string-carrier`                                             | 0155 | blocked | `activemodel-unskip-attribute-and-type-mutation-tests`                                   |
| `ruby-compat-marshal-core-types`                                          | 0154 | draft   | `activemodel-port-marshal-and-yaml-error-tests`                                          |
| `psych-load-and-safe-load`                                                | 0170 | draft   | `activemodel-port-marshal-and-yaml-error-tests`                                          |
| `port-hash-eql-rows-surfaced-by-scoring`                                  | 0156 | ready   | `activemodel-parity-100-close-out`                                                       |
| `port-non-accessor-rows-from-level-keyed-set`                             | 0156 | ready   | `activemodel-parity-100-close-out`                                                       |
| `port-remaining-class-hosted-accessor-instance-seats`                     | 0156 | ready   | `activemodel-parity-100-close-out`                                                       |
| `attribute-set-to-h-alias-unported`                                       | 0082 | draft   | `activemodel-parity-100-close-out`                                                       |
| `inline-is-mass-assignment-empty-into-assign-attributes`                  | 0023 | draft   | `activemodel-parity-100-close-out`                                                       |
| `rails-test-name-parity-rollout-activemodel`                              | 0127 | draft   | `activemodel-parity-100-close-out`                                                       |
| `test-compare-lint-and-serializers-json-mapping`                          | 0123 | blocked | `activemodel-parity-100-close-out`                                                       |

## Stories

| Story                                                                 | est-loc | Cluster     |
| --------------------------------------------------------------------- | ------- | ----------- |
| `activemodel-port-type-value-limit-precision-scale-and-registry-copy` | 160     | api-surface |
| `activemodel-dirty-init-attributes-arity`                             | 120     | api-surface |
| `activemodel-port-version-and-gem-version`                            | 100     | api-surface |
| `activemodel-name-match-operators`                                    | 120     | skips       |
| `activemodel-api-initialize-concern-constructor` (blocked)            | 250     | skips       |
| `activemodel-score-core-object-freeze-and-initialize-clone`           | 220     | skips       |
| `activemodel-lifecycle-hook-semantics-audit`                          | 300     | skips       |
| `activemodel-converge-attribute-methods-call-rows`                    | 200     | calls-args  |
| `activemodel-converge-secure-password-bcrypt-password`                | 250     | calls-args  |
| `activemodel-converge-registration-json-date-comparability-rows`      | 220     | calls-args  |
| `activemodel-option-keys-to-zero`                                     | 120     | calls-args  |
| `activemodel-audit-permanent-receipts-root`                           | 400     | receipts    |
| `activemodel-audit-permanent-receipts-subdirs`                        | 350     | receipts    |
| `activemodel-burn-extra-surface-to-zero`                              | 450     | placement   |
| `activemodel-enroll-in-extra-surface-gate-rowless`                    | 80      | placement   |
| `activemodel-converge-moves-residue`                                  | 400     | placement   |
| `activemodel-verify-and-pin-protocol-bodies`                          | 150     | pins        |
| `activemodel-converge-dropped-block-arms`                             | 300     | arms        |
| `activemodel-converge-missing-control-flow-arms`                      | 300     | arms        |
| `activemodel-converge-invented-control-flow-arms-type`                | 350     | arms        |
| `activemodel-converge-invented-control-flow-arms-rest`                | 450     | arms        |
| `activemodel-duck-type-instanceof-to-respond-to`                      | 120     | arms        |
| `activemodel-map-railtie-test-onto-trailtie`                          | 150     | tests       |
| `activemodel-unskip-attribute-and-type-mutation-tests`                | 250     | tests       |
| `activemodel-port-marshal-and-yaml-error-tests`                       | 200     | tests       |
| `activemodel-relocate-ts-only-tests-to-trails-siblings`               | 250     | tests       |
| `activemodel-parity-100-close-out`                                    | 150     | closeout    |

## Blocked

- `activemodel-api-initialize-concern-constructor` — TS language: a class constructor chain is fixed at `extends` time; ruby-compat include()/prepend() copy prototype members and cannot install or wrap a constructor, and CLAUDE.md ratifies no alternative. Needs a ruby-compat construction hook designed first.

## Non-goals

- **Rewriting the parity tools' scoring model.** Where a tool is wrong, the owning story fixes that one
  fault with a test; broader tooling redesign stays in RFCs 0127 / 0156.
- **Ratifying new CLAUDE.md sections.** A story that finds a genuine language shortcoming is filed
  `blocked` with the blocker; deciding to ratify is a separate, explicit decision.
- **`no-explicit-any` allowlists.** They are type-hygiene registers, not parity axes.
- **Other packages.** activesupport, actionpack, trailties and ruby-compat have their own parity RFCs;
  ruby-compat work appears here only where an activerecord/activemodel/arel row needs a carrier.

## Alternatives considered

- **Leaving activemodel out of the extra-surface gate.** Rejected: a package burned to zero with no gate
  regrows; activerecord's rowless enrollment is the model.
- **Keeping `=~`/`!~` scoped out because nothing consumes an offset.** Rejected: that is a scoring
  argument; trails has an operator-spelling mechanism.

## Rollout

1. **API surface and skips** — `activemodel-port-type-value-limit-precision-scale-and-registry-copy`, `activemodel-dirty-init-attributes-arity`, `activemodel-port-version-and-gem-version`, `activemodel-name-match-operators`, `activemodel-api-initialize-concern-constructor`, `activemodel-score-core-object-freeze-and-initialize-clone`, `activemodel-lifecycle-hook-semantics-audit`
2. **Calls and args** — `activemodel-converge-attribute-methods-call-rows`, `activemodel-converge-secure-password-bcrypt-password`, `activemodel-converge-registration-json-date-comparability-rows`, `activemodel-option-keys-to-zero`
3. **Receipts** — `activemodel-audit-permanent-receipts-root`, `activemodel-audit-permanent-receipts-subdirs`
4. **Placement and extra-surface gate** — `activemodel-burn-extra-surface-to-zero`, `activemodel-enroll-in-extra-surface-gate-rowless`, `activemodel-converge-moves-residue`
5. **Pins and arms** — `activemodel-verify-and-pin-protocol-bodies`, `activemodel-converge-dropped-block-arms`, `activemodel-converge-missing-control-flow-arms`, `activemodel-converge-invented-control-flow-arms-type`, `activemodel-converge-invented-control-flow-arms-rest`, `activemodel-duck-type-instanceof-to-respond-to`
6. **Tests** — `activemodel-map-railtie-test-onto-trailtie`, `activemodel-unskip-attribute-and-type-mutation-tests`, `activemodel-port-marshal-and-yaml-error-tests`, `activemodel-relocate-ts-only-tests-to-trails-siblings`
7. **Close-out** — `activemodel-parity-100-close-out`

## Verification

`activemodel-parity-100-close-out`'s acceptance criteria: every § "Baseline" row at target on a clean build,
activemodel rowless on `parity:api:extra:gate`, and the only named residue the blocked
`activemodel-api-initialize-concern-constructor`.

## Open questions

1. **Is `ActiveModel::API#initialize` ratifiable?** Deferred: filed `blocked` on a ruby-compat construction
   hook rather than ratified. Ratifying it is a separate CLAUDE.md decision.

## Changelog

- 2026-09-30: initial RFC (27 stories, 6,410 est-loc).
