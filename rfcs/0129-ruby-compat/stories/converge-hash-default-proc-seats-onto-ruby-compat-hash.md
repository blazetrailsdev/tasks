---
title: "HashWithIndifferentAccess and Rack::Headers extend ruby-compat's Hash instead of copying its default seat"
status: ready
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: 46
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Filed after PR #7321 (`converge-hash-default-proc-seats`, RFC 0129) closed that
story with a **receipt** rather than a convergence. The receipt is debt, not
permission, so this is the convergence story it points at.

Two classes carry their own copy of ruby-compat's `Hash` default seat —
`defaultProc`, `default`, and the paired mutual-clearing writes:

- `packages/activesupport/src/hash-with-indifferent-access.ts:126-168`
- `packages/rack/src/headers.ts:105-131`

against `packages/ruby-compat/src/hash.ts`'s `Hash#default` /
`Hash#default=` / `Hash#default_proc` / `Hash#default_proc=`, the ports of
`vendor/ruby/hash.c:2238,2265,2285,2308`. Both hosts subclass `Hash` in Ruby
(`activesupport/lib/active_support/hash_with_indifferent_access.rb:53`
`class HashWithIndifferentAccess < Hash`; `vendor/rack/lib/rack/headers.rb`
`class Headers < Hash`) and inherit the seat for free.

**What the receipt claims, and what is actually unproven.** The receipt says
delegation is impossible because `rb_hash_default_value`
(`vendor/ruby/hash.c:2068`) yields the RECEIVER to the proc, so a held `Hash`
would hand the block the inner seat where Ruby hands it the host. That part is
true and load-bearing — `hash_with_indifferent_access.rb:227` yields `self`.

What was NOT established is that inheritance is impossible. Neither class
extends anything today, so `class HashWithIndifferentAccess<V> extends Hash<string, V>`
and `class Headers extends Hash<string, string>` are both available, and that is
what Ruby does. The obstacle is storage, not the type system: each class holds
its own `Map` (`data` / `_data`) behind a key-converting layer, so inheriting
`Hash` today means inheriting a second, unused `Map` — and `Hash extends Map`,
so the hosts would start answering `instanceof Map`.

## Converged shape

Each host extends ruby-compat's `Hash` and uses the INHERITED storage as its
one seat, with `get`/`set`/`has`/`delete`/`keys` overridden to convert the key
(exactly the layer each already has), so `default()`, `setDefault()`,
`defaultProc()` and `setDefaultProc()` are inherited rather than copied and the
proc is yielded the host, as Ruby yields `self`. The
`@noRailsEquivalent PERMANENT` receipts at both sites are deleted, not reworded.

Check the `instanceof Map` consequence before landing: grep for duck-typed
`instanceof Map` / `Symbol.iterator` widening that a `HashWithIndifferentAccess`
or `Headers` would newly satisfy.

## Acceptance criteria

- `defaultProc`, `default` and their mutual-clearing writes have exactly one
  implementation, in `packages/ruby-compat/src/hash.ts`.
- Both hosts extend that `Hash`; the default_proc is yielded the HOST, pinned by
  a test at each site.
- `pnpm parity:structural-duplicates:report` no longer lists a `defaultProc`
  candidate.
- The two `@noRailsEquivalent PERMANENT` receipts are gone.
- `pnpm parity:api:extra:gate` unchanged or tightened; no baseline widened.
- If the `instanceof Map` fallout makes this genuinely unlandable, `tasks block`
  it with the specific call sites — do not close it by re-stating the receipt.
