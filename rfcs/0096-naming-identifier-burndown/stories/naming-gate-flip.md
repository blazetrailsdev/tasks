---
title: "Gate the naming class once the burndown has drained it"
status: blocked
updated: 2026-08-14
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
population is the **permanent residue** — 6.4% of the class as measured
2026-08-13, but NOT the tooling shape the disposition guessed at. It is the
classifier's three permanent classes: JS reserved words, Ruby constructs with no
JS equivalent, and names the conventions table itself produces (RFC 0096
`## Residue taxonomy`). Those get baselined per CLASS, each with the one shared
reviewed reason `NAMING_CLASSES` carries; the class then gates like any other.

## Acceptance criteria

1. `lint-call-args.ts` gates `naming` rows alongside `shape` — one population,
   no class filter in the gate (`--report` keeps its per-class breakdown).
2. The residue is seeded into the existing shards as `kind: "args"` rows, each
   carrying its CLASS's shared reviewed reason from
   `scripts/api-compare/naming-taxonomy.ts` — never the seeded placeholder, and
   never a bespoke sentence per row.
   2b. No `burndown` or `module-mixin-receiver` row is seeded. Those converge (by
   renaming and by rewiring to the `this`-typed mixin idiom respectively);
   baselining them would ratify convergeable divergence. A non-empty count in
   either class means the flip is not ready, not that the rows need reasons.
3. RFC 0095 `## Rollout`, RFC 0096, CLAUDE.md and CONTRIBUTING.md stop
   describing `naming` as report-only.
4. `pnpm parity:api:calls:args` is green on `main` immediately after.
