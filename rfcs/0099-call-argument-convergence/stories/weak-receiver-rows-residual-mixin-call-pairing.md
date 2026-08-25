---
title: "weak-receiver-rows-residual-mixin-call-pairing"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6510
claim: "2026-08-14T09:57:07Z"
assignee: "weak-receiver-rows-residual-mixin-call-pairing"
blocked-by: null
closed-reason: null
---

## Context

Residual of `converge-weak-receiver-surfaced-call-arg-rows` (PR #6500), which
converged four of that story's seven surfaced call-argument rows
(`Relation#update`, `Relation#update!`, `Multipart::Parser#read_data`,
`SourceAnnotationExtractor.enumerate`). Three rows remain, and neither is a
plain "pass what Rails passes" edit:

1. **actiondispatch `http/request.ts` — `call` with `ref:rawPost`.** This is a
   PAIRING ARTIFACT, not a divergence. Rails' site is
   `strategy.call(raw_post)` (`actionpack/lib/action_dispatch/http/parameters.rb:95`),
   and the port already passes `this.rawPost` at that exact site
   (`packages/actionpack/src/action-dispatch/http/parameters.ts:192`). The row
   pairs Rails' `strategy.call` against the `Function.prototype.call` of the
   settled Ruby-`include` mixin idiom in `request.ts`'s delegating wrapper
   (`packages/actionpack/src/action-dispatch/http/request.ts:1008`,
   `_parseFormattedParameters.call(this._paramsHost, parsers, fallback)`).
   The fix belongs in the extractor/comparer, not in the port: `checkCallArgs`
   should not pair a Ruby `.call` site against a TS `Function.prototype.call`
   used to dispatch a mixin function. Until then the row is inert noise.

2. **activesupport `testing/time-helpers.ts` — `stub_object` / `stubbing`
   receiving `ref:clock` where Rails passes `const:Time`** (2 rows,
   `activesupport/lib/active_support/testing/time_helpers.rb:178-179`). Already
   owned end-to-end by RFC 0098's ready story
   `time-helpers-stub-date-and-datetime-clock`, and documented on the holder's
   `@noRailsEquivalent CONVERGEABLE` tag in
   `packages/activesupport/src/time-travel.ts`. Converging the arguments means
   routing the trails clock through `@blazetrails/date`'s `Time.now` /
   `Date.today` / `DateTime.now` so the stub target IS `Time` — that story's
   whole scope. Nothing to do here beyond confirming the rows retire when it
   lands.

Note that the gate change that surfaced these rows
(`call-args-weak-receiver-sites-excluded-from-population`) never landed, so
none of the seven baseline rows exist in `main` today; they will reappear when
it does.

## Acceptance criteria

- [ ] `checkCallArgs` no longer pairs a Ruby `recv.call(...)` site against a TS
      `Function.prototype.call` mixin dispatch, with a unit test covering the
      `request.ts` / `parameters.rb:95` shape.
- [ ] The actiondispatch row is gone from the compared population (not
      baselined) once the weak-receiver population change lands.
- [ ] The two time-helpers rows are confirmed retired by
      `time-helpers-stub-date-and-datetime-clock`, or, if that story lands
      first, verified green here.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
