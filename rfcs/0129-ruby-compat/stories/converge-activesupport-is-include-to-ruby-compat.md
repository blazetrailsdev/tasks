---
title: "converge-activesupport-is-include-to-ruby-compat"
status: claimed
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 27
pr: null
claim: "2026-08-31T20:49:55Z"
assignee: "burn-down-ruby-compat-novel-surface-and-pin"
blocked-by: null
closed-reason: null
---

## Context

Found by `pnpm parity:structural-duplicates:report` (RFC 0129,
`structural-duplicate-detector-report`) — one of only two real duplicates in a
235-candidate run, and one the name-based
`no-ruby-compat-reimplementation` rule cannot see, because the duplicate is
spelled `isInclude`, not `hasKey`.

`packages/activesupport/src/hash-utils.ts:119-121` declares:

```ts
export function isInclude(hash: AnyObject, key: string): boolean {
  return Object.hasOwn(hash, key);
}
```

Its own JSDoc says it "Mirrors Ruby's `Hash#include?` — an alias of
`Hash#has_key?`". That is precisely
`packages/ruby-compat/src/hash.ts:42` `hasKey`, the port of
`rb_hash_has_key` (`vendor/ruby/hash.c:3671`) — same primitive, same one-line
body, same `Object.hasOwn` reasoning about own vs. prototype keys.

Ruby core owns `Hash#include?`/`Hash#has_key?`; Rails does not define either
(`vendor/rails/activesupport/lib/active_support/core_ext/hash/` has no such
file), so there is no Rails counterpart obliging activesupport to carry its own
body. The structural report matches the two on the shared skeleton
`["ref:hasOwn"]`.

Note the barrel collision the JSDoc records: `isInclude` reaches
`@blazetrails/activesupport`'s index as `isIncludeObj` because `Range#include?`'s
port owns the bare name there. Converging onto `hasKey` from
`@blazetrails/ruby-compat` removes the collision rather than renaming around it.

## Acceptance criteria

- `isInclude` deleted from `packages/activesupport/src/hash-utils.ts`; every
  call site imports `hasKey` from `@blazetrails/ruby-compat` instead.
- The `isIncludeObj` barrel alias in activesupport's index goes with it.
- `pnpm parity:structural-duplicates:report` no longer lists a candidate under
  `hasKey`.
- `pnpm parity:api:extra:gate` and `pnpm parity:api:calls` unchanged or
  tightened; no baseline widened.
