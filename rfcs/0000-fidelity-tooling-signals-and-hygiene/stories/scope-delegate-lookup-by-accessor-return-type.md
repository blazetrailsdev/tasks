---
title: "Scope the delegation-transparency delegate lookup by accessor return type"
status: ready
updated: 2026-07-27
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Follow-up to #5346, which added delegation transparency to the call-parity gates
(`isDelegatingWrapper` / `effectiveTsCalls`, `scripts/api-compare/compare.ts`).

When a matched TS body is a one-line forwarder — `return
this.pgSchemaStatements().indexes(tableName)` — the gate compares it against the
call-set of the same-named method resolved via `tsCallsByName`, a by-NAME union
across the package and its deps. That is deliberately coarser than the
per-(file, name) scoping the primary population uses: an unrelated same-named
method on a different class can satisfy a Ruby call it has nothing to do with.
The tradeoff is documented at the call site in `effectiveTsCalls`.

It was accepted because the imprecision is only reachable for bodies
`isDelegatingWrapper` has already established contain no ported logic (self-named
call, ≤ `DELEGATION_MAX_CALLS` calls total), and because tightening it needs
information the extractor does not currently record: the accessor's declared
return type. In `postgresql-adapter.ts` the wrapper's call-set is
`{indexes, pgSchemaStatements}`; resolving `pgSchemaStatements()` to
`PostgreSQLSchemaStatements` (declared in
`connection-adapters/postgresql/schema-statements-class.ts`) would let the lookup
be scoped to that one file instead of the whole package.

No current gate outcome is known to be wrong because of this — the story is
precision insurance, not a bug fix. Do not start it before confirming a real case
slips through, or it is speculative machinery.

## Acceptance criteria

- Record the declared return type of a zero-arg accessor method in `MethodInfo`
  (`scripts/api-compare/types.ts` + `extract-ts-api.ts`), enough to resolve
  `pgSchemaStatements()` → the class that owns the delegate.
- Scope `effectiveTsCalls`'s delegate lookup to the resolved collaborator's file
  when the return type resolves, falling back to today's by-name union when it
  does not (a `this`-typed mixin binding, an interface-typed accessor).
- Prove the tightening is behaviour-preserving on the current tree: reseeding
  must produce the SAME baselines (wide 4993, narrow 15). A change in either
  count means the coarse lookup was masking or manufacturing a flag — investigate
  before accepting.
- Extend the `delegation transparency` describe block in `compare.test.ts` with a
  case where two same-named methods live on unrelated classes and only the
  resolved one may satisfy the call.

## Path refresh — 2026-08-17

Citations in this body predate the RFC 0092 `parity:*` consolidation, which moved
several modules out of `scripts/api-compare/` into `scripts/parity/`. Verified
current locations:

- `scripts/api-compare/types.ts` -> `scripts/parity/types.ts`

## Re-verified 2026-08-17 (ready sweep)

`scripts/api-compare/types.ts` moved to `scripts/parity/types.ts`;
`compare.ts` stayed put and `isDelegatingWrapper` / `effectiveTsCalls` are
unchanged.
