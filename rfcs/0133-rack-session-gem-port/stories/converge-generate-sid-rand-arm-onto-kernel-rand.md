---
title: "generate_sid's non-secure arm must draw through a Kernel.rand analogue, not a hand-rolled BigInt loop"
status: in-progress
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 28
pr: 7404
claim: "2026-09-02T20:13:34Z"
assignee: "converge-null-session-hash-superclass"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Session::Abstract::Persisted#generate_sid`'s non-secure arm is Ruby's
`Kernel.rand`:

```ruby
"%0#{@sid_length}x" % Kernel.rand(2**@sidbits - 1)
```

(`vendor/rack-session/lib/rack/session/abstract/id.rb:289`.)

trails hand-rolls the draw instead
(`packages/rack-session/src/abstract/id.ts`, `generateSid`'s `else` arm): a
BigInt accumulator filled 32 bits at a time from
`Math.floor(Math.random() * 0x1_0000_0000)`, then `% limit`, then
`toString(16).padStart(...)`. There is no `Kernel.rand` in
`@blazetrails/ruby-compat`, so the arm is an invented body rather than a port —
the `% limit` in particular is a modulo of a value already narrower than the
limit's bit width in the general case, which is not what
`Kernel.rand(max)` means (`vendor/ruby/random.c`, `rb_f_rand` → `random_rand`
draws uniformly in `0...max`).

Surfaced in PR #7384 while converging the secure arm onto
`secure.hex(@sid_length)`; the secure arm is now faithful and this one is the
remaining divergence in the same method.

## Converged shape

Add a `Kernel.rand` analogue to `@blazetrails/ruby-compat` with its MRI citation
(`vendor/ruby/random.c`, `rb_f_rand`), matching the shape
`kernel-float.ts` already uses for `Kernel#Float`, and call it from the `else`
arm so the body reads as the Ruby does. The `"%0#{@sid_length}x"` format is a
zero-padded hex render of the drawn integer.

Note the arm is reachable: `generate_sid(false)` is the `NotImplementedError`
rescue target (`abstract/id.rb:290`), and `spec_session_abstract_persisted.rb`'s
`#generated_sid generates a session identifier` drives it directly.

## Acceptance criteria

- The non-secure arm draws through a ruby-compat `Kernel.rand` analogue carrying
  its MRI citation, rather than a hand-rolled BigInt loop.
- The rendered value is a zero-padded `@sid_length`-wide hex string, as
  `"%0#{@sid_length}x"` produces.
- `pnpm parity:api:extra:gate` stays green (ruby-compat is pinned at novel 0, so
  the new export needs a `@noRailsEquivalent PERMANENT` receipt).
- `pnpm parity:test` rack-session non-negative.
