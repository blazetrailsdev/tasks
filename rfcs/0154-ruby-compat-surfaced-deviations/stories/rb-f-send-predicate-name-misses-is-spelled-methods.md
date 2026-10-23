---
title: "numericality NUMBER_CHECKS dispatches through a registry, not a send predicate arm"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Triaged under `triage-send-name-guessing-stories-against-the-direct-call-rule`:
this story originally asked `sendInternal` (`packages/ruby-compat/src/object.ts`)
to look every `foo?` up under its `isFoo` spelling. CLAUDE.md § "A dispatch by
name is spelled directly (`send`, `public_send`)" (ruled 2026-10-20) forbids
widening the name guessing to make a call site work, so the story is rewritten
as the call-site convergence of the one Rails body that motivated it.
Absorbs `rb-f-send-finds-a-predicate-under-either-spelling` (closed as a
duplicate). Whether the general `?` arm survives is decided by 0194
`delete-send-name-guessing-arms`.

`NumericalityValidator#validate_each`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:14,50-51`)
is `unless value.to_i.public_send(NUMBER_CHECKS[option])` over the closed table
`NUMBER_CHECKS = { odd: :odd?, even: :even? }`. The port
(`packages/activemodel/src/validations/numericality.ts:89-91,124`) keeps the
Ruby symbols (`":odd?"`, `":even?"`) and sends them through `rbFPublicSend`,
which only works because `sendInternal` carries a dedicated `isOdd` / `isEven`
arm for an Integer receiver (`object.ts:1224-1229`, documented at `:1115-1121`).

The name set is closed (two Ruby predicates, `rb_int_odd_p` /
`rb_int_even_p`, `vendor/ruby/v3.3.11/numeric.c:3564,3588`), so CLAUDE.md's
first fallback applies: an explicit, module-private registry from the
Ruby-visible name to a typed function.

## Acceptance criteria

- [ ] `numericality.ts` dispatches `NUMBER_CHECKS[option]` through a
      module-private registry mapping `odd?` / `even?` to ruby-compat's Integer
      predicates (exported at their `is…` names with MRI citations if they are
      not already), called on `toI(value)`; no `rbFPublicSend` for it.
- [ ] `sendInternal`'s `isOdd` / `isEven` arm and its JSDoc sentence are
      deleted, unless 0194 `delete-send-name-guessing-arms` records another
      computed-name caller that reaches it.
- [ ] The numericality odd/even tests stay green; `pnpm parity:api:sends`,
      `parity:api:calls` and `parity:api:extra:gate` are green.
