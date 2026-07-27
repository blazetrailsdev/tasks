---
title: "significantMissingCalls has eight positional parameters; collapse the defaulted collaborators"
status: draft
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

`significantMissingCalls` (`scripts/api-compare/compare.ts:245`) now takes
**eight** positional parameters, the last five of which are defaulted
collaborators:

```ts
significantMissingCalls(
  rubyName,
  rubyCalls,
  tsCalls,
  isPortedWithArgs,
  (mapCall = rubyMethodToTs),
  (significant = SIGNIFICANT_CALLS),
  (aliasCall = jsEnumerableAliases),
  (negatedTsCalls = new Set()),
);
```

PR #5428 added the eighth (`negatedTsCalls`). Because the defaults are
positional, the production call site in `main()` must now pass
`jsEnumerableAliases` explicitly just to reach the parameter after it, and every
test that wants to exercise one late parameter has to spell out the ones before
it. The next dimension added to the calls-parity check pays the same tax, and a
call site that passes an argument in the wrong slot type-checks whenever two
neighbouring parameters share a shape (`Set<string>` and `Set<string>`, or the
two predicate-shaped ones) — a silent misconfiguration of the gate.

Not urgent and not a fidelity issue: the function is pure and well covered by
`compare.test.ts`, so this is maintainability, not correctness.

## Acceptance criteria

- [ ] Collapse the five defaulted collaborators into a single options object
      (keep `rubyName`, `rubyCalls`, `tsCalls`, `isPortedWithArgs` positional,
      or move all of them — either is fine as long as the late parameters are
      named at the call site).
- [ ] Update the `main()` call site in `compare.ts` and every
      `significantMissingCalls` call in `compare.test.ts`.
- [ ] No behavior change: `pnpm api:calls:wide` and the narrow
      `lint-call-mismatches.ts` gate both stay green with unchanged baseline
      counts, and `scripts/api-compare/` tests pass.
