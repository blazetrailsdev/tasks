---
title: "Gate the naming class once the burndown has drained it"
status: blocked
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps:
  - naming-residue-taxonomy-recalibration
  - naming-burndown-3-ar-adapters
  - naming-burndown-3-ar-persistence-relation
  - naming-burndown-3-ar-model-encryption-tasks
  - naming-burndown-3-activesupport
  - naming-burndown-3-arel-activemodel
  - naming-burndown-3-tail
  - naming-burndown-3-ar-structural-residue
  - wave-4-cluster-remaining-naming-rows
  - wave-4-naming-ar-adapters
  - wave-4-naming-ar-relation
  - wave-4-naming-ar-model
  - wave-4-naming-activesupport
  - wave-4-naming-activemodel
  - wave-4-naming-arel-i18n-tail
  - wave-4-naming-mixin-receiver-rewire
deps-rfc: []
est-loc: 80
pr: null
claim: "2026-08-11T01:14:36Z"
assignee: "arel-collector-argument-order-convergence"
blocked-by: "Precondition restated in measured terms by naming-residue-taxonomy-recalibration (2026-08-13). The classifier at scripts/api-compare/naming-taxonomy.ts measures 21 of 329 surviving naming rows (6.4%) as permanently unconvergeable — the disposition's magnitude, but NOT its composition: the residue is JS reserved words, Ruby constructs with no JS equivalent, and conventions-table renames, essentially none of it the tooling shape this flip planned to baseline. #6459's 73% figure folded convergeable classes into unconvergeable. Flip when the open wave-3 deps land and the report's permanent classes are all that remain; baseline them per CLASS (one shared reason each), never the burndown or module-mixin-receiver rows."
closed-reason: null
---

## Context

The closing story of the RFC 0096 naming burndown, and the one that makes the
campaign's completion mechanical rather than declared.

`naming` rows are report-only today: `lint-call-args.ts` gates the `shape` rows
of the shared `call-mismatches-exclude/` shards
(`gatedRows`, `scripts/api-compare/call-args-baseline.ts`) and `naming` is
reachable only via `pnpm parity:api:calls:args:report`. That was decided in RFC
0095 `## Naming-dimension disposition` because ~880 naming rows would have
swamped the 736-row shape baseline.

Once the per-package burndown stories have drained the class, the remaining
population is the **permanent residue** — the classifier's permanent classes:
JS reserved words, Ruby constructs with no JS equivalent, and names the
conventions table itself produces (RFC 0096 `## Residue taxonomy`). Those get
baselined per CLASS, each with the one shared reviewed reason `NAMING_CLASSES`
carries; the class then gates like any other.

## Measured population (2026-08-18, re-measured for this story)

`pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args:report`

**311 naming rows total** — 259 convergeable (`burndown` 249 +
`module-mixin-receiver` 10), 52 permanent across seven classes.

Split against the AR require-closure (`scripts/api-compare/ar-closure.ts`):

| scope                                                                                                      | convergeable | permanent |   total |
| ---------------------------------------------------------------------------------------------------------- | -----------: | --------: | ------: |
| **AR closure** (activerecord, activesupport, activemodel, arel, i18n, globalid, activerecord-test-support) |       **94** |    **43** | **137** |
| out of scope (actiondispatch 79, actioncontroller 31, rack 28, actionview 26, trailties 1)                 |          165 |         8 |     173 |

Two corrections to this story's earlier precondition, both material:

1. **The permanent residue is not 6.4%.** That figure came from the
   2026-08-13 reading (21 of 329). Repo-wide it is now **52 of 311 (16.7%)**,
   and **inside the AR closure it is 43 of 137 (31.4%)** — nearly a third. The
   seeding step in criterion 2 is roughly twice the size it was scoped for.
2. **63% of the convergeable work is out of scope.** 165 of the 259
   `burndown`/`module-mixin-receiver` rows are in actionpack-family packages.
   Criterion 2b as originally written ("a non-empty count in either class means
   the flip is not ready") therefore gated this flip on **completing actionpack
   naming work**, which RFC 0096 never owned and which is not on the
   ActiveRecord parity path.

## Re-scope (2026-08-18)

**Gate the AR closure; leave the rest report-only.** The flip lands when the
closure's 94 convergeable rows reach zero and its 43 permanent rows are seeded —
not when all 15 packages are clean.

Precedent for a package-scoped measurement is already in-repo:
`ASSERTION_REPORT_PACKAGES` (`scripts/test-compare/compare.ts:80`) restricts the
assertion dimension to a package subset and is explicitly report-only outside it.

The 173 out-of-scope rows are not abandoned — they stay measured by
`--report` and want their own RFC, filed against the actionpack-family packages
when someone owns them. They are not this story's precondition.

## Acceptance criteria

1. `lint-call-args.ts` gates `naming` rows alongside `shape` **for AR-closure
   packages**, resolved from `ar-closure.ts` rather than a hand-written list so
   a moved `require` moves the gate. `--report` keeps its per-class breakdown
   for every package.
2. The in-closure residue is seeded into the existing shards as `kind: "args"`
   rows, each carrying its CLASS's shared reviewed reason from
   `scripts/api-compare/naming-taxonomy.ts` — never the seeded placeholder, and
   never a bespoke sentence per row.
   2b. No `burndown` or `module-mixin-receiver` row **in an AR-closure package**
   is seeded. Those converge (by renaming and by rewiring to the `this`-typed
   mixin idiom respectively); baselining them would ratify convergeable
   divergence. A non-empty in-closure count in either class means the flip is
   not ready, not that the rows need reasons. Out-of-closure counts do not gate.
3. RFC 0095 `## Rollout`, RFC 0096, CLAUDE.md and CONTRIBUTING.md stop
   describing `naming` as report-only **for the AR closure**, and say plainly
   that it remains report-only elsewhere.
4. `pnpm parity:api:calls:args` is green on `main` immediately after.
5. The out-of-scope population is recorded — count and packages — in RFC 0096's
   changelog, so the residue is handed off rather than silently dropped.
