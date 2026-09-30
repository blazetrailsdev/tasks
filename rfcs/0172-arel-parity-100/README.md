---
rfc: "0172-arel-parity-100"
title: "arel at 100% on every parity axis"
status: active
created: 2026-09-30
updated: 2026-09-30
owner: "@deanmarano"
packages:
  - "arel"
clusters:
  - api-surface
  - arms
  - closeout
  - pins
  - placement
  - receipts
  - skips
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
  - "0173-activemodel-parity-100"
  - "0174-activerecord-api-parity-100"
  - "0175-activerecord-test-parity-100"
priority: 2
---

# RFC 0172 — arel at 100% on every parity axis

## Summary

arel is the closest of the three data-layer packages to full parity: tests, assertions, arity, params,
inheritance and the call-set gate are already at 100% / 0. This RFC seeds every story needed to take the
remaining axes — name coverage, one call-args row, receipts, extra surface, body pins, skipped
definitions, control-flow arms, moves and the deps lint — to 100%, and then pins each gate at zero.
**13 stories, 2,830 est-loc.** It is one of four sibling RFCs (0172 arel, 0173 activemodel,
0174 activerecord source, 0175 activerecord tests) authored together from one measurement pass.

## Motivation

### Baseline

Measured 2026-09-30 on trails `main` @ `ea7d456048` after a clean `pnpm build`, with `pnpm parity:api` (+ `--calls`), `parity:api:calls`, `:calls:args`, `:params`, `:predicates`, `:extra`/`:extra:gate`, `:arms:throws`, `:arms:report`, `:blocks`, `:parents`, `:pins`, `:receipts:gate`, `:moves`, `:returns`, `:duck-types`, `:deps`, `parity:structural-duplicates:report`, `parity:test` (+ `--missing`), `parity:test:assertions`, `parity:fixtures`, `parity:schema`, and a grep of `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` / `@missingRailsName` receipts in `packages/<pkg>/src`.

| Axis                                                                  | Now                                           | Target                  | Where the residue lives                                                                                     | Stories                                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `parity:api` methods                                                  | 1041/1044 (99.7%)                             | 100%                    | `nodes/bound_sql_literal.rb#inspect`, `nodes/comment.rb#initialize_copy`, `nodes/window.rb#initialize_copy` | `arel-port-bound-sql-literal-inspect-and-node-initialize-copy`                                           |
| files / inheritance / arity / params                                  | 74/74, 69/69, 720/720, 596/596                | hold                    | —                                                                                                           | close-out                                                                                                |
| denominator: global skip                                              | 4 (`nil?` ×3, `Case#then`)                    | 0                       | `SKIP_GROUPS[0]` in `scripts/parity/conventions.ts`                                                         | `arel-score-core-object-names-nil-and-case-then`                                                         |
| body pins                                                             | 711/759 (48 unpinned)                         | 100%                    | `eql?`/`hash` on 24 node files                                                                              | `arel-verify-and-pin-eql-hash-bodies`                                                                    |
| `parity:api:calls` baseline rows                                      | 0                                             | 0                       | —                                                                                                           | —                                                                                                        |
| `parity:api:calls:args` shape rows                                    | 1                                             | 0                       | `call-mismatches-exclude/arel/visitors/visitor.json`                                                        | `arel-visitor-dispatch-cache-and-visit-rescue-arm`                                                       |
| naming rows / `@missingRailsName`                                     | 0 / 0                                         | 0                       | —                                                                                                           | —                                                                                                        |
| `parity:api:params` mark                                              | 0                                             | 0                       | —                                                                                                           | —                                                                                                        |
| `parity:api:predicates`                                               | 0                                             | 0                       | —                                                                                                           | —                                                                                                        |
| `parity:api:extra:gate`                                               | novel 0 (pinned), total 35                    | rowless (0/0)           | 25 files, all _moved_                                                                                       | `arel-burn-moved-extra-surface-*`                                                                        |
| `@noRailsEquivalent`                                                  | 13 PERMANENT, **7 free-form**, 0 CONVERGEABLE | ratified PERMANENT only | `index.ts`, `tree-manager.ts`, `nodes/node.ts`, …                                                           | `arel-converge-freeform-no-rails-equivalent-receipts`, `arel-audit-permanent-receipts-against-claude-md` |
| `@missingRailsArgs` / `@missingRailsCall`                             | 2 PERMANENT / 0                               | ratified only           | `visitors/`                                                                                                 | same audit                                                                                               |
| `parity:api:arms:throws` mark                                         | 1                                             | 0                       | `visitors/visitor.ts#visit`                                                                                 | `arel-visitor-dispatch-cache-and-visit-rescue-arm`                                                       |
| `parity:api:blocks` mark                                              | 0                                             | 0                       | —                                                                                                           | —                                                                                                        |
| arms report (if/loop/try/rescue)                                      | 10 missing pairs, 34 invented pairs           | 0                       | `visitors/to-sql.ts`, `select-manager.ts`, `table.ts`, …                                                    | `arel-converge-missing-control-flow-arms`, `arel-converge-invented-control-flow-arms`                    |
| `parity:api:moves`                                                    | 66                                            | 0                       | include-chain double counting (`factory-methods.ts`, `expressions.ts`, …)                                   | `arel-converge-moves-residue`                                                                            |
| `parity:api:deps`                                                     | 1 ref mismatch (arel → activemodel)           | 0                       | `nodes/homogeneous-in.ts`                                                                                   | `arel-deps-lint-to-zero`                                                                                 |
| `parity:test`                                                         | 739/739, 59/59 files                          | hold                    | —                                                                                                           | close-out                                                                                                |
| `parity:test:assertions`                                              | 0/0/0                                         | hold                    | —                                                                                                           | close-out                                                                                                |
| unported files / scoped skips / arity excludes / inheritance excludes | 0 / 0 / 0 / 0                                 | hold                    | —                                                                                                           | —                                                                                                        |

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

### Existing stories this RFC depends on

| Existing story                                                            | RFC  | Status | Needed by                                                                                                         |
| ------------------------------------------------------------------------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `arel-node-dup-missing`                                                   | 0023 | draft  | `arel-port-bound-sql-literal-inspect-and-node-initialize-copy`, `arel-audit-permanent-receipts-against-claude-md` |
| `ruby-compat-hash-keys-by-identity-not-eql`                               | 0154 | draft  | `arel-visitor-dispatch-cache-and-visit-rescue-arm`                                                                |
| `override-of-inherited-rails-member-scores-moved`                         | 0120 | draft  | `arel-burn-moved-extra-surface-nodes`, `arel-burn-moved-extra-surface-managers-collectors-namespaces`             |
| `moves-counts-a-mixin-member-declared-on-the-host-interface-as-misplaced` | 0127 | draft  | `arel-converge-moves-residue`                                                                                     |
| `arel-homogeneous-in-valuetype-vs-activemodel-type`                       | 0025 | draft  | `arel-deps-lint-to-zero`                                                                                          |

## Stories

| Story                                                          | est-loc | Cluster     |
| -------------------------------------------------------------- | ------- | ----------- |
| `arel-port-bound-sql-literal-inspect-and-node-initialize-copy` | 160     | api-surface |
| `arel-visitor-dispatch-cache-and-visit-rescue-arm`             | 220     | api-surface |
| `arel-converge-freeform-no-rails-equivalent-receipts`          | 250     | receipts    |
| `arel-audit-permanent-receipts-against-claude-md`              | 300     | receipts    |
| `arel-burn-moved-extra-surface-nodes`                          | 300     | placement   |
| `arel-burn-moved-extra-surface-managers-collectors-namespaces` | 260     | placement   |
| `arel-converge-moves-residue`                                  | 200     | placement   |
| `arel-score-core-object-names-nil-and-case-then`               | 180     | skips       |
| `arel-verify-and-pin-eql-hash-bodies`                          | 150     | pins        |
| `arel-converge-missing-control-flow-arms`                      | 300     | arms        |
| `arel-converge-invented-control-flow-arms`                     | 350     | arms        |
| `arel-deps-lint-to-zero`                                       | 40      | api-surface |
| `arel-parity-100-close-out`                                    | 120     | closeout    |

## Blocked

None. Every axis in this RFC can reach 100% without a new CLAUDE.md ratification.

## Non-goals

- **Rewriting the parity tools' scoring model.** Where a tool is wrong, the owning story fixes that one
  fault with a test; broader tooling redesign stays in RFCs 0127 / 0156.
- **Ratifying new CLAUDE.md sections.** A story that finds a genuine language shortcoming is filed
  `blocked` with the blocker; deciding to ratify is a separate, explicit decision.
- **`no-explicit-any` allowlists.** They are type-hygiene registers, not parity axes.
- **Other packages.** activesupport, actionpack, trailties and ruby-compat have their own parity RFCs;
  ruby-compat work appears here only where an activerecord/activemodel/arel row needs a carrier.

## Alternatives considered

- **One umbrella RFC for all three packages.** Rejected: activerecord alone is ~160 stories, and a single
  README over 2,000 lines fails `validate`; per-package RFCs also let arel close first and pin its gates.
- **Seeding arms/moves stories only after the tooling fixes.** Rejected per the growth-ratio finding
  (under-seeded RFCs grow 4–9×): the stories are seeded now with the full current row lists and depend on
  the tooling story, so the post-fix residue already has an owner.

## Rollout

1. **API surface and receipts** — `arel-port-bound-sql-literal-inspect-and-node-initialize-copy`, `arel-visitor-dispatch-cache-and-visit-rescue-arm`, `arel-converge-freeform-no-rails-equivalent-receipts`, `arel-audit-permanent-receipts-against-claude-md`, `arel-deps-lint-to-zero`
2. **Skips and pins** — `arel-score-core-object-names-nil-and-case-then`, `arel-verify-and-pin-eql-hash-bodies`
3. **Placement** — `arel-burn-moved-extra-surface-nodes`, `arel-burn-moved-extra-surface-managers-collectors-namespaces`, `arel-converge-moves-residue`
4. **Arms** — `arel-converge-missing-control-flow-arms`, `arel-converge-invented-control-flow-arms`
5. **Close-out** — `arel-parity-100-close-out`

## Verification

`arel-parity-100-close-out`'s acceptance criteria are the verification: every row of § "Baseline" at its
target on a clean build, `extra-surface-mark.json` without an arel row (rowless), and no arel row in any
report-only axis.

## Open questions

1. **Should `Case#then` stay a thenable-shaped overload?** Resolved: yes — scored through a scoped entry,
   because `Relation#then` is the ratified thenable and a global `then` mapping would be wrong for it.
2. **Where do the per-arel ruby-compat carriers land?** Resolved: `compare_by_identity` is RFC 0154's
   `ruby-compat-hash-keys-by-identity-not-eql`; this RFC only depends on it.

## Changelog

- 2026-09-30: initial RFC (13 stories, 2,830 est-loc).
