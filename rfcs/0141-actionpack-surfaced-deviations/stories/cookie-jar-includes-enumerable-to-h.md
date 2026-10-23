---
title: "CookieJar includes Enumerable; to_h comes from Enumerable, not a hand-written method"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

Rails' `CookieJar` does `include Enumerable, ChainedCookieJars`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/cookies.rb:314`)
and defines `alias :to_hash :to_h` (`:358`), so `to_h` (and `map`, `select`, …)
come from Enumerable over `each`.

`CookieJar` in `packages/actionpack/src/action-dispatch/middleware/cookies.ts`
now has a hand-written `toH()` (`:221`) with `toHash` aliased to it (`:460`),
and the "to hash" test asserts both (`dispatch/cookies.test.ts:104-109`). But it
still includes only `ChainedCookieJars` (`:462`), not `Enumerable`, so `toH` is
an own method where Rails inherits it, and the jar answers none of
Enumerable's other methods.

## Acceptance criteria

- `CookieJar` includes ruby-compat's `Enumerable` before `ChainedCookieJars`, as
  `cookies.rb:314` does, over its `each`.
- `toH` comes from Enumerable (port `Enumerable#to_h`, `vendor/ruby/v3.3.11/enum.c`
  `enum_to_h`, if ruby-compat lacks it) and the hand-written `CookieJar#toH` is
  deleted; `toHash` stays the alias of `toH`.
- `cookies.test.ts` "to hash" stays green.
