---
title: "activerecord: restore the 11 dropped Rails branches in relation (report-arms missing rows)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: arms
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 432
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=activerecord --direction=missing` (RFC 0113; `if`/`loop`/`try`/
`rescue` are report-only, only `throw` is gated). A missing arm is a Rails branch the port does not take —
9 in 10 are real (RFC 0113's stratified read). The relation pairs:

- `relation/batches.ts#batchOnUnloadedRelation` — `-if -if +loop`
- `relation/calculations.ts#pluck` — `-if`
- `relation/calculations.ts#executeGroupedCalculation` — `-loop -loop -loop -loop +if +if +if +if`
- `relation/delegation.ts#generateMethod` — `-if +loop`
- `relation/predicate-builder.ts#expandFromHash` — `-if -if -if -if -if -if -if +loop`
- `relation/query-attribute.ts#valueForDatabase` — `-if`
- `relation/query-methods.ts#eachJoinDependencies` — `-loop`
- `relation/query-methods.ts#buildJoinDependencies` — `-if +loop`
- `relation/query-methods.ts#buildArel` — `-if -if`
- `relation/query-methods.ts#buildJoinBuckets` — `-loop`
- `relation/query-methods.ts#structurallyIncompatibleValuesFor` — `-if -if`

## Acceptance criteria

- [ ] Each pair's branches match its Rails body (CLAUDE.md § "Control flow"): same guards, order, early returns.
- [ ] The missing-direction report shows 0 activerecord rows in these files.
- [ ] Tests exercising the restored branches are ported or already green.
