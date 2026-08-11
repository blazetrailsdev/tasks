---
title: "Gate the naming class once the burndown has drained it"
status: blocked
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps:
  - naming-burndown-relation-bulk-write-attributes
  - naming-burndown-2-pg-adapter
  - naming-burndown-2-actiondispatch-routing-middleware
  - naming-burndown-2-ar-model-core
  - naming-burndown-2-ar-associations
  - naming-burndown-2-arel-activemodel
  - naming-burndown-2-ar-abstract-adapters
  - naming-burndown-2-rack
  - naming-burndown-2-actiondispatch-http
  - naming-burndown-2-actionview
  - naming-burndown-2-activesupport
  - naming-burndown-2-actioncontroller
  - naming-burndown-2-ar-encryption-and-tasks
  - naming-burndown-2-tail
  - naming-burndown-2-ar-relation-insert-all
  - naming-burndown-2-ar-mysql-sqlite-adapters
deps-rfc: []
est-loc: 80
priority: 30
pr: null
claim: "2026-08-11T01:14:36Z"
assignee: "arel-collector-argument-order-convergence"
blocked-by: "Precondition still unmet, re-measured 2026-08-11 on origin/main ff1fa59d4 (fresh pnpm build + API_COMPARE_FORCE=1 pnpm parity:api --calls): 532 naming rows remain (of 962 call-arg rows), down from 886 but far above the ~6% tooling residue this flip requires. Deps now name the 16 wave-2 burndown stories that cover all 532 rows; unblock once they land and the report shows only the tooling-shaped residue."
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
