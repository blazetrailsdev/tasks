---
title: "parity:api arity: the global name pool credits a port through an unrelated same-named signature"
status: draft
updated: 2026-10-02
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The arity check in `scripts/api-compare/compare.ts` (`checkArity`, the `tsParamsByName` pool) matches
a Ruby method against every TS signature of that name across the package and its deps, and passes
if any one overlaps. The pool exists so a 0-argument re-export binding in an aggregator file does
not false-positive against the real signature in the mixin's source file.

The cost is that an unrelated same-named method credits a wrong port. trails PR 8408 found nine
ActiveModel methods carrying a leading `super_` parameter that the pool had credited
(`Errors#initializeDup(other)` credited `Dirty#initializeDup(super_, other)`), and closed only that
one class with `threadsSuper` (`scripts/api-compare/arity.ts`).

Measured on main at `0b98904c6e`: restricting the candidates to the matched TS file whenever that
file declares the name with at least one positional parameter moved overall arity from 9668/9734 to
9551/9734, so about 117 pairs are matched only through another file's signature. Per package the
matched count fell to: activesupport 1263/1334, activerecord 3750/3788, actiondispatch 1018/1042,
trailties 362/380, abstractcontroller 59/66, rack-test 54/61, activemodel 449/456,
actioncontroller 402/408, arel 781/782, actionview 668/669. Some of those are real arity
deviations and some are a sibling class in the same file (`visitors/dot.ts` `constructor`).

## Acceptance criteria

- [ ] The arity check prefers the matched file's own signatures for a name, falling back to the pool only where the file holds a 0-argument binding or no declaration.
- [ ] Each row the change surfaces is either converged, or shown to be a same-file sibling-class homonym the owner scoping resolves (as `tsParamsByFileOwnerNameInPkg` does for parameter names).
- [ ] `pnpm parity:api --arity` reports no pair credited solely by a signature in another file.
