---
title: "Ported-with-args population is a main() closure with no testable seam"
status: in-progress
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 4
pr: 7388
claim: "2026-09-02T13:04:16Z"
assignee: "gate-positive-adapter-drop-rule-differs-between-extractors"
blocked-by: null
closed-reason: null
---

## Context

Found while working `0126/call-gate-population-includes-test-helpers` (PR #7210),
where it cost a full review round.

`recordTsParams` is a closure declared inside `compare.ts#main()`
(`scripts/api-compare/compare.ts:3030`). It populates two disjoint groups of
maps under two separate `if (scope === "package")` blocks:

- the owner maps (`tsOwnersByFileName`, `tsBodylessOwnersByFileName`,
  `tsWriterOwnersByFileName`, `tsStaticOwnersByFileName`,
  `tsInstanceOwnersByFileName`, `tsDeclFileByFileNameOwner`), and
- the ported-with-args population (`tsParamsByNameInPkg`,
  `tsParamsByFileNameInPkg`) — the maps `resolvePortedWithArgsSigs` reads.

Because it is a closure over `main()`'s locals, there is no seam to unit-test
what either group ends up holding. PR #7210 added the
`!isTestHelperFile(file)` guard to the second block; a revert/restore probe
during development moved it onto the FIRST block, and:

- every gate stayed green,
- `pnpm vitest run scripts/api-compare/` stayed green (45 files), and
- `API_COMPARE_FORCE=1 pnpm parity:api --calls` produced a **byte-identical**
  `call-mismatches.json` under both placements.

The misplacement was invisible to every form of measurement the repo has and was
caught only by a reviewer reading the function. A guard on the wrong population
is exactly the class of bug this tooling exists to prevent elsewhere.

## Converged shape

Lift the two population blocks out of the `main()` closure into a named,
exported builder taking its inputs explicitly (the manifest entries plus the
per-file predicates it consults) and returning the maps, so `compare.ts` wires
it and a test can call it directly. No behaviour change — this is a seam, not a
redesign, and the two blocks keep their current split and contents.

Then pin the population with a test: a `test-helpers/*.ts` method signature must
not surface through `resolvePortedWithArgsSigs`, and an ordinary source file's
must.

## Acceptance criteria

- [ ] The ported-with-args population is built by a named exported function
      rather than a closure inside `main()`; owner-map construction moves with
      it or stays, but the two stay distinguishable to a caller.
- [ ] A test proves a `src/test-helpers/**` method does NOT enter the population
      `resolvePortedWithArgsSigs` reads, and that a sibling source file's does —
      i.e. the test fails if the guard is moved to the owner-map block.
- [ ] No change to any parity number: `API_COMPARE_FORCE=1 pnpm parity:api
--calls` produces an identical artifact before and after.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` stay green with no
      baseline row added and no mark reseeded.
