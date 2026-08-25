---
title: "Remove the UNSEEDED bootstrap arm once the args baseline is seeded"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: null
packages: []
deps: ["call-args-baseline-seed"]
deps-rfc: []
est-loc: 30
priority: null
pr: 6345
claim: "2026-08-10T16:40:51Z"
assignee: "call-args-remove-unseeded-bootstrap-arm"
blocked-by: null
closed-reason: null
---

## Context

`lint-call-args.ts` carries a bootstrap arm: when NO `kind: "args"` row is
baselined and the artifact flags rows, it prints `UNSEEDED` and exits 0 instead
of failing with the whole population. It exists only because the gate
(`call-args-ratchet-and-ci-step`, PR #6334) had to land before
`call-args-baseline-seed`, and a gate with an empty baseline would have redded
the merge train for every PR in between.

It is narrow and cannot swallow a converged dimension — nothing baselined AND
nothing flagged takes the normal path and passes as a real green — but once the
seed has landed it is unreachable except by hand-deleting every args row from
the tree, which is precisely the case that SHOULD fail loudly rather than
report.

Depends on `call-args-baseline-seed`. Do not land this before the seed.

## Acceptance criteria

1. `renderUnseeded` and its call site are deleted from `lint-call-args.ts`; an
   empty args population with flagged rows fails as NEW rows like any other
   ratchet.
2. The test covering the arm goes with it; the "nothing baselined AND nothing
   flagged is a real green" behavior stays covered.
3. The UNSEEDED paragraph is removed from the `lint-call-args.ts` header,
   CLAUDE.md and CONTRIBUTING.md.
4. `pnpm parity:api:calls:args` stays green on `main`.
