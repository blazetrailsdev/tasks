---
title: "String#unpack supports the m / m0 Base64 directive"
status: draft
updated: 2026-10-19
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`String#unpack` in ruby-compat (`packages/ruby-compat/src/array.ts:303`, `packUnpackInternal`) has no `m` directive, so `unpack("m")` / `unpack("m0")` raise `ArgumentError: unknown unpack directive`. MRI implements it in `vendor/ruby/v3.3.11/pack.c` (the `case 'm'` arm of `pack_unpack_internal`, `pack.c:936`). The `pack` side already has `m` (`array.ts:217`).

`packages/rack-session/src/cookie.test.ts` ports `spec_session_cookie.rb`'s `str.unpack('m0').first` (`vendor/rack-session/v2.1.0/test/spec_session_cookie.rb:96-160`) and the non-strict coder's `str.unpack('m').first` (`:540`) as `Base64.strictDecode64` / `Base64.decode64` as a workaround.

## Acceptance criteria

- [ ] `unpack` supports `m` (lenient) and `m0` (strict, raising `ArgumentError` on invalid input), following `pack.c`.
- [ ] cookie.test.ts uses `unpack(str, "m0")[0]` / `unpack(str, "m")[0]` as the spec does.
