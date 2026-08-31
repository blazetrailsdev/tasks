---
title: "converge-activesupport-except-to-ruby-compat"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 28
pr: 7314
claim: "2026-08-31T20:49:55Z"
assignee: "burn-down-ruby-compat-novel-surface-and-pin"
blocked-by: null
closed-reason: null
---

## Context

Found by `pnpm parity:structural-duplicates:report` (RFC 0129,
`structural-duplicate-detector-report`) — the second of only two real duplicates
in a 235-candidate run.

`packages/activesupport/src/hash-utils.ts:147-153` declares an `except` that
copies the object and deletes the named keys. That is
`packages/ruby-compat/src/hash.ts:199` `except`, the port of
`rb_hash_except` (`vendor/ruby/hash.c:2683`) — same primitive, same body shape.

The reason it belongs in ruby-compat and not activesupport is the Rails source:
`vendor/rails/activesupport/lib/active_support/core_ext/hash/except.rb` defines
`Hash#except!` **only**. `Hash#except` has been Ruby core since 3.0, so
ActiveSupport no longer carries it, and neither should trails' activesupport —
there is no Rails counterpart for that TS declaration to mirror.

(The report's third `except` hit, `packages/i18n/src/utils.ts:12`, is a
faithful port of `i18n/lib/i18n/utils.rb`'s own `except` and is NOT in scope:
the gem defines it, so fidelity requires the local body.)

## Acceptance criteria

- `except` deleted from `packages/activesupport/src/hash-utils.ts`; every call
  site imports `except` from `@blazetrails/ruby-compat` instead.
- Its barrel re-export in activesupport's index goes with it.
- `pnpm parity:structural-duplicates:report` no longer lists an activesupport
  candidate under `except`.
- `pnpm parity:api:extra:gate` and `pnpm parity:api:calls` unchanged or
  tightened; no baseline widened.
