---
title: "CookieJar includes Enumerable; to_hash aliases to_h"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `CookieJar` does `include Enumerable, ChainedCookieJars`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/cookies.rb:314`)
and defines `alias :to_hash :to_h` (`:358`), so `to_h` comes from Enumerable.
`CookieJar` in `packages/actionpack/src/action-dispatch/middleware/cookies.ts`
includes only `ChainedCookieJars` (`include(CookieJar, ChainedCookieJars)`) and
hand-writes `toHash`. ruby-compat's `Enumerable` has no `toH`. Because of that,
`cookies_test.rb:39-43` "to hash" can't port its second assertion
(`request.cookie_jar.to_h`).

## Acceptance criteria

- ruby-compat `Enumerable` gains `toH` (Ruby `Enumerable#to_h`, `vendor/ruby/v3.3.11/enum.c`).
- `CookieJar` includes `Enumerable`, and `toHash` is an alias of `toH`.
- The "to hash" test in `cookies.test.ts` asserts both `toHash()` and `toH()`.
