---
title: "enroll-actioncontroller-in-protocol-call-mapping"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PROTOCOL_CALL_ENROLLED_PACKAGES` (`scripts/parity/conventions.ts`) maps a Rails
body's calls to `PROTOCOL_DEFINITION_NAMES` (`inspect`, `dup`, `to_a`, `to_h`,
`to_hash`, …) into the call gate through `rubyCallToTs`, so a port that drops
a `.dup` or renders with `JSON.stringify` where Rails calls `inspect` is
flagged. `inspect` is credited by ruby-compat's `rbInspect`
(`Kernel#inspect` in `scripts/parity/ruby-compat.ts`), `to_a` by `toArray`.

The set is only-grow, and `actioncontroller` was left out because enrolling it adds these
1 rows (measured by adding `"actioncontroller"` to the set and running
`pnpm parity:api:calls`):

- `metal/params-wrapper.ts` `wrap_parameters` omits `to_h`

The row is not a one-line fix: trails' `wrapParameters`
(`packages/actionpack/src/action-controller/metal/params-wrapper.ts`) is a
params-rewriting function with no Rails shape, where Rails'
`ParamsWrapper::ClassMethods#wrap_parameters`
(`actionpack/lib/action_controller/metal/params_wrapper.rb:221-240`) builds
`Options.from_hash _wrapper_options.to_h.slice(:format).merge(options)` and
assigns `_wrapper_options`. Converging it means porting that class method.

## Acceptance criteria

- Each row above is converged in the TS body — the call Rails makes is made,
  `inspect` through `rbInspect` or the value's own ported `inspect`, `dup`
  as the receiver's `dup` — citing the Rails `file:line`. None is baselined.
- `"actioncontroller"` is added to `PROTOCOL_CALL_ENROLLED_PACKAGES`, and
  `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
  `pnpm parity:api:calls:ruby-compat` are green with it enrolled.
