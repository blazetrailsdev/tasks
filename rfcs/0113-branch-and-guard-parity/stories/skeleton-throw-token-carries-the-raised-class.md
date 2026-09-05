---
title: "Skeleton throw token carries the raised class; arms report gains a raise-class verdict"
status: claimed
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: arm-parity-tooling
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 3
pr: null
claim: "2026-09-05T20:51:57Z"
assignee: "skeleton-throw-token-carries-the-raised-class"
blocked-by: null
closed-reason: null
---

## Context

The skeleton's `throw` token carries no class. `skeleton_push_name`
(`scripts/api-compare/extract-ruby-api.rb:2782`) maps any `raise` to the bare
token `throw`; `extractSkeleton` (`scripts/api-compare/extract-ts-api.ts:4243`)
maps any `ThrowStatement` to the same. So a port that raises `ActiveRecordError`
where Rails raises `RecordNotSaved`, or raises a bare `Error`, is indistinguishable
from a faithful one — and a missing raise is indistinguishable from a moved one.

That matters because the missing-raise class is the one RFC 0113 rates highest
(Rollout Phase 5: "a dropped raise is a silent wrong answer; a dropped fast
path is a performance note"), and it is the one signal the noise-floor
measurement never isolated. `pnpm parity:api:arms:report` today:

```text
Missing arms by token
  if       598
  throw    106
  try       63
  loop      62
```

The 62.5% artefact rate that took the RFC ungated was measured over ALL
tokens; nothing says the 106 `-throw` rows share it. A `throw` that names its
class is both a sharper report and the precondition for re-measuring that one
class on its own (see `remeasure-arm-noise-floor-per-token`).

The Ruby side already has the pairing logic: `drop_raised_new` (`:2481`) pairs
`raise Foo.new(msg)` and `raise Foo, msg` for the call set. Reuse it in the
skeleton walk: for `raise Const, …` / `raise Const.new(…)` emit
`throw:Const`; for a bare `raise` / `raise "msg"` (RuntimeError) / `raise e`
(re-raise) emit `throw`. The class is the constant's LAST segment
(`ActiveRecord::RecordNotSaved` → `RecordNotSaved`), matching how `new:Const`
is already spelled by `skeleton_const_name` (`:2795`).

TS side: `throw new Foo(...)` → `throw:Foo` (identifier or the last property of
a `PropertyAccessExpression`, as the `new:` branch does at `:4276`); `throw e`
and `throw someCall()` → `throw`.

Report side: `compareArms` (`report-arms.ts:110`) projects onto
`CONTROL_TOKENS` (`:42`). Treat `throw:*` as the `throw` token for the
count/order verdict so existing rows do not move, and add a third verdict,
`raise-class`, for pairs whose multiset agrees only after erasing the class —
those are RFC 0111's "same error class" rows, surfaced here without a second
extractor.

## Acceptance criteria

- [ ] Ruby `raise Foo, "m"`, `raise Foo.new("m")` and `raise Foo` all emit
      `throw:Foo`; bare `raise`, `raise "m"` and `raise e` emit `throw`. Unit
      test in `extract-ruby-api.test.ts`.
- [ ] TS `throw new Foo(...)` and `throw new NS.Foo(...)` emit `throw:Foo`;
      `throw e` emits `throw`. Unit test in `extract-ts-api.test.ts`.
- [ ] `compareArms` erases the class for the `count` / `order` verdicts (row
      count of the arms report is UNCHANGED by this story, recorded in the PR
      body) and adds a `raise-class` verdict listing `Foo -> Bar` pairs.
- [ ] `renderReport` gains a "Raise class mismatches" section; the sample
      renderer prints the class-bearing tokens.
- [ ] Nothing new gates.
