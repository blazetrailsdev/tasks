---
title: "ruby-compat: pack's text overload accepts m*/M*/u*"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Array#pack` treats `m*` the same as `m` (`vendor/ruby/v3.3.11/pack.c:281-284`),
and the result is US-ASCII text. ruby-compat's `pack` overloads
(`packages/ruby-compat/src/array.ts:117-135`) return `string` only for the literal
formats `"m" | "m0" | "M" | "u" | "U" | "U*"`. So `pack([s], "m*")`, which
`vendor/rack/v3.1.14/test/spec_auth_basic.rb:33,96` uses, falls through to
`string | Uint8Array`, and `packages/rack/src/auth-basic.test.ts` casts it with
`as string`.

## Acceptance criteria

- [ ] The text-returning overload accepts the `*` forms of the text directives (`m*`, `M*`, `u*`).
- [ ] The `as string` casts in `auth-basic.test.ts` are removed.
