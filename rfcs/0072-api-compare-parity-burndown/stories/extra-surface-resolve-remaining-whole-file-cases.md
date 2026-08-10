---
title: "Resolve the three remaining whole-file no-counterpart cases (libsql, temporal-wire, sql-datetime)"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6135
claim: "2026-08-05T16:33:09Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

PR #5950 added the file-level `@noRailsEquivalent` form (a reason in a JSDoc
block above a file's imports, covering every otherwise-extra name in a file no
Rails file maps onto) and converted the six SQLite driver-variant adapters to
it. Three more whole-file cases were identified in that story's context and
deliberately left out of #5950, because each needs its own judgement and would
CHANGE the novel totals rather than being net-zero:

- `packages/activerecord/src/sqlite/libsql.ts` — 11 novel
- `packages/activerecord/src/connection-adapters/abstract/temporal-wire.ts` — 10 novel
- `packages/activerecord/src/connection-adapters/abstract/sql-datetime.ts` — 12 novel

Counts from `pnpm parity:api:extra --package activerecord` at the time of #5950.

This is explicitly NOT "go tag these 33 names". The tag is a claim that has to
be true, and the allowlist is not a place to park deferred work. For each file
the question is which of two answers is correct:

1. the file genuinely has no Rails counterpart (a JS-ecosystem driver binding,
   a Temporal/wire-format concern Ruby does not have) — one file-level
   `PERMANENT` reason, or
2. the names are an unconverged port that belongs in a Rails-layout file — then
   the work is the relocation/rename, not a tag.

`fileTagVerdict` already refuses the tag when any name in the file scores
`moved`, so answer 1 is only available where the report agrees no name exists
anywhere in Rails-land. That check is the starting evidence for each file, not
the conclusion.

## Acceptance criteria

- Each of the three files is resolved as either (1) one file-level reason
  opening with `PERMANENT`, naming the Ruby fact that makes it permanent, or
  (2) converged, with the names moved/renamed to their Rails-layout home.
- No name is tagged `CONVERGEABLE` as a way of deferring — if it is
  convergeable, either converge it here or register the convergence as its own
  story and leave the name counted.
- `pnpm parity:api:extra --package activerecord` novel total moves by exactly the
  number of names resolved by answer 1; the report is re-run and the new totals
  are stated in the PR body.
- `pnpm vitest run scripts/api-compare/extra-surface.test.ts` passes.
