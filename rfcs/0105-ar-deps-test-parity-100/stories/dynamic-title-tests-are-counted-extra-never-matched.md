---
title: "Statically expand loop-generated it() titles so dynamic tests match"
status: done
updated: 2026-08-30
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 7265
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:test` cannot match a test whose `it()` title is a template literal, so a
loop-generated case is **double-counted wrong**: the Rails names read as
`Missing`, and the TS cases read as `extra (TS only)`. Both the parity percentage
and the missing-test worklist are wrong wherever a suite loops over cases.

The extractor already recovers a skeleton and deliberately stops there —
`scripts/test-compare/extract-ts-core.ts:540-572`:

> The skeleton is a label for the audit, not a name to match on — see
> `TestCaseInfo.dynamic`.

and `compare.ts:343`:

> `dynamic: boolean; // name recovered from a template literal — never a match candidate`

`compare.ts:1006-1009` reports the population under `--dynamic`. Measured on
main at 2026-08-30: **32 dynamically-named tests across 16 files**, including
`transactions.test.ts` (2 loops = 4 cases), `autosave-association.test.ts`,
`relation/delegation.test.ts`, `cache/serializer-with-fallback.test.ts` (5),
`inflector.test.ts`, `journey/path/pattern.test.ts`.

Two concrete instances verified by hand:

- `transactions.test.ts:589,603` — `` `cancellation from before filters
rollbacks in ${filter}` `` over `["validation","save"]`, plus the `!` variants.
  All four Rails names are fully implemented and passing, ported by
  `before-filter-db-side-effect-cancellation` (RFC 0023, PR #4264, done), yet
  all four report Missing.
- `autosave-association.test.ts:4655` — `` `should run remove callback
${callbackType}s for has many` `` over `["method","proc"]`; both report Missing.

**The Ruby extractor already does the thing this story asks for on its own side**
— `extract-ruby-define-method.test.ts` covers "expands a constant array whose
name interpolates klass.name.gsub" and "reports a loop whose name interpolation
is not statically evaluable". The asymmetry is the defect: Ruby-side loops are
statically expanded, TS-side loops are not.

## Converged shape

Statically evaluate a TS `it()` title whose interpolations resolve to a literal
array iterated by an enclosing `for...of` (the overwhelmingly common shape, and
the one the Ruby side already handles), emitting one manifest entry per expansion
with a real name. Where a title is not statically evaluable, keep today's
skeleton-plus-`dynamic` behaviour and keep reporting it under `--dynamic`, so the
unresolvable residue stays visible rather than silently matching.

## Acceptance criteria

- The four `cancellation from before filters rollbacks in ...` cases and the two
  `should run remove callback ...s for has many` cases match their Rails names,
  and disappear from both the Missing and the extra (TS only) columns.
- `pnpm parity:test --dynamic` reports only the genuinely unresolvable residue.
- activerecord's Missing count drops by 6 with no test file edited.
- A test covers a loop over a literal array, a loop whose values are not
  statically evaluable, and a nested/multi-span title.
