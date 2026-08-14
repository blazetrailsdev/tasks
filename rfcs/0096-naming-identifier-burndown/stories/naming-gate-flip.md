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
blocked-by: "Precondition still unmet, and now known to be mis-sized. All 16 wave-2 deps landed, but PR #6459 (merged 2026-08-13) measured the surviving activerecord naming rows and found ~57 of 78 (73%) cannot close by any rename — an order of magnitude above the ~6% tooling residue this flip assumes, and mostly not the tooling shape it plans to baseline. Deps now name the open wave-3 stories plus naming-residue-taxonomy-recalibration, which must re-derive the residue taxonomy and restate this precondition in measured terms before the gate can flip."
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
population is the ~6% tooling residue measured in the disposition: a chained
Ruby call recorded by its last name (`Regexp.escape(suffix.to_s)` → `ref:toS`)
and a nested call recorded as a `ref:`. Those get baselined with reviewed
reasons; the class then gates like any other.

## Acceptance criteria

1. `lint-call-args.ts` gates `naming` rows alongside `shape` — one population,
   no class filter in the gate (`--report` keeps its per-class breakdown).
2. The residue is seeded into the existing shards as `kind: "args"` rows, each
   with a real reviewed `reason` naming the tooling shape it stands for — never
   the seeded placeholder.
3. RFC 0095 `## Rollout`, RFC 0096, CLAUDE.md and CONTRIBUTING.md stop
   describing `naming` as report-only.
4. `pnpm parity:api:calls:args` is green on `main` immediately after.
