---
title: "gateStale cannot see a @noRailsEquivalent receipt on a never-harvested declaration"
status: draft
updated: 2026-09-07
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`gateStale` (`scripts/api-compare/extra-surface.ts:2735-2741`) exists to fail a
run on a `@noRailsEquivalent` tag whose name "no longer flags as extra
surface" — a receipt that suppresses nothing is debt masquerading as a
decision. It cannot see a whole class of them.

`extract-ts-api.ts:864-899` handles `export const X = {...}` and bails out
early on two conditions, **before** any tag is read:

- `if (isConstantCaseName(decl.name.text)) continue;` (`:870`; the predicate is
  at `:2940`, `/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/`)
- `if (methods.length === 0) continue;` — an object literal of data rather than
  methods (`harvestObjectLiteralMethods`)

A declaration skipped there is never harvested, so it never enters the tagged
set, so `gateStale` has nothing to compare and stays silent. The receipt is
dead, and nothing says so.

Found in PR #7594: `ADAPTER_ARG_FAMILIES`
(`packages/activerecord/src/connection-adapters/adapter-args.ts`) is an
exported CONSTANT_CASE const holding a string-valued object literal. It shipped
with `@internal` + `@noRailsEquivalent PERMANENT`. Both gates ran green — the
receipt suppressed nothing (`total` measured 622 with and without the JSDoc,
and the name never appears in `parity:api:extra --package activerecord`) and
`gateStale` did not flag it. It was caught by hand, by reading the extractor.

Note this is the same failure shape as a receipt in `test-helpers/**` (an
unmeasured file), but reached through an unmeasured _declaration_ in a measured
file, so a path-based check would not catch it.

## Converged shape

Collect `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` tags
from the source independently of whether the declaration they sit on was
harvested as surface, then report any tag whose declaration is not in the
measured population as STALE with the reason ("declaration is never measured —
CONSTANT_CASE const / data-only object literal / internal"). That is what
`gateStale`'s own message already claims to cover.

Two follow-on decisions belong in the story:

- Whether `@internal` alone on such a declaration stays legal (it should — it
  is a plain TypeDoc directive and `unbacked-internal-needs-receipt` correctly
  does not fire, since the name is unmeasured rather than
  internal-tagged-and-public).
- Whether the new STALE class is gated immediately or reported for one cycle;
  there may be existing instances, and the gate is a hard CI gate.

## Acceptance criteria

- [ ] A `@noRailsEquivalent` tag on an exported CONSTANT_CASE const, and on a
      data-only exported object literal, is reported as STALE.
- [ ] A regression test in `scripts/api-compare/extra-surface.test.ts` covers
      both shapes and fails on baseline.
- [ ] Any existing instances the new check surfaces are removed, not
      allowlisted.
- [ ] `pnpm parity:api:extra:gate` and the `Rails API/Test Comparison` CI job
      stay green.
