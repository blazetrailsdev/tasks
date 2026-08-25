---
title: "protectedparams-method-named-parameter-unreadable-by-index"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Closing as accepted deviation, per the story's own third acceptance criterion. The residual is in a test-support stub (packages/activerecord/src/support/stubs/strong-parameters.ts), nothing fails today (no canonical column collides with a method name), and closing it needs a wrapper shape Rails does not have — the docblock note is its permanent home."
---

## Context

`ProtectedParams` (`packages/activerecord/src/support/stubs/strong-parameters.ts`,
merged in PR #5690) stores its parameters in a private `#parameters` field and
projects them as own enumerable properties through a Proxy, mirroring Rails'
`@parameters` ivar (`vendor/rails/activerecord/test/support/stubs/strong_parameters.rb:5-11`).

The Proxy's `get` / `getOwnPropertyDescriptor` traps let a method declared on
the class win over a same-named parameter, which is what removes the shadowing
hazard #5690 was filed for. The mirror-image residual deviation is that such a
parameter is then NOT readable as `params[name]` or through spread, where Ruby's
`#[]` (`strong_parameters.rb:22-24`) returns it unconditionally because the ivar
is a separate namespace. `toH()` is the only way to read a colliding parameter
back.

No canonical-schema column collides with `keys` / `isKey` / `hasKey` / `isEmpty`
/ `permitted` / `permitBang` / `toH` / `toUnsafeH` / `eachPair`, so nothing is
failing — this is the documented residual, filed so it is tracked rather than
living only in the file's docblock.

## Acceptance criteria

- Decide and record whether the residual is closable in JS at all: reading a
  colliding parameter via `params[name]` requires the method surface and the
  parameter namespace to be separable, which the current single-object shape
  cannot do (a wrapper exposing the methods on a sibling object, or dropping
  the `params[key]` affordance in favour of an explicit accessor, are the two
  shapes worth weighing against the AR call sites).
- If closable, `params[name]` and spread return the parameter for a
  method-named key while every method stays callable; the regression test
  `a parameter named after a method does not shadow the method` is extended to
  pin both halves.
- If not closable, the docblock note is the deviation's permanent home and this
  story closes as accepted-deviation.
- `pnpm parity:api --package activerecord-test-support` stays at 32/32.
