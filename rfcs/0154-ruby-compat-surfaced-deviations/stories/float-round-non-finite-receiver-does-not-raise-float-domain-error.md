---
title: "ruby-compat: Float#round with ndigits 0 answers Infinity / NaN where MRI raises FloatDomainError"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8387, which ported `flo_round` (`vendor/ruby/v3.3.11/numeric.c:2505-2536`) into `packages/ruby-compat/src/numeric.ts#round` arm for arm except the two arms that turn a non-finite Float into an Integer.

On ruby 3.3.11 `Float::INFINITY.round` and `Float::NAN.round(-1)` raise `FloatDomainError` (`"Infinity"` / `"NaN"`): `ndigits < 0` goes through `flo_to_i` and `ndigits == 0` through `dbl2ival`, and both raise for a value with no Integer. `Float::INFINITY.round(2)` answers `Infinity` (the `isfinite` guard's fall-through).

In trails the `ndigits < 0` arm already raises (it calls `toI`), but `if (ndigits === 0) return roundHalfUp(number, 1);` answers `Infinity` / `NaN`. The arm was left as it was in #8387 because `round(x)` is called on durations by `packages/actionpack/src/action-controller/log-subscriber.ts`, `packages/actionpack/src/action-dispatch/log-subscriber.ts` and `packages/actionview/src/log-subscriber.ts`; check each call site hands it a finite value before raising.

## Acceptance criteria

- [ ] `round(Infinity)` and `round(NaN)` raise `FloatDomainError` with Ruby's message; `round(Infinity, 2)` still answers `Infinity`.
- [ ] Each existing `round(x)` caller is shown to pass a finite value, or handles the raise where Rails does.
- [ ] A `.trails.test.ts` case pins the three answers.
