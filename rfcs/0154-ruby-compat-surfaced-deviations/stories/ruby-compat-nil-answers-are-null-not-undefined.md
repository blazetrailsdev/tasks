---
title: "first, last, zip and values_at answer nil as null, not undefined"
status: draft
updated: 2026-10-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails represents Ruby `nil` as JS `null`. A field, return or parameter that may be `nil` is typed `T | null`, and ported code tests for it with `x == null` or `x != null`. Four ruby-compat functions answer Ruby's `nil` as `undefined` instead:

- `first` (`packages/ruby-compat/src/array.ts`), the `Array#first` port. `rb_ary_first` (`vendor/ruby/v3.3.11/array.c:1888`) answers `nil` for an empty array.
- `last` (`array.ts`, two overloads), `Array#last`. `rb_ary_last` (`array.c:1914`) answers `nil` for an empty array.
- `zip` (`array.ts`), `Array#zip`. `rb_ary_zip` (`array.c:4422`) pads a shorter argument with `nil`.
- `valuesAt` (`packages/ruby-compat/src/hash.ts`, three overloads), `Hash#values_at`. `rb_hash_values_at` (`hash.c:2713`) answers `nil` for a missing key.

The codegen generator (RFC 0185) now types generated signatures from the hand port's declared types, including nullability. A `first(...)` result returned from a method the hand port types `T | null` fails tsc, `T | undefined` against `T | null`, and so does passing it on to a `T | null` parameter. Generated activerecord has about 30 such errors at `codegen-native-inference`.

## Converged shape

Each function answers `null` where Ruby answers `nil`, and its return type says `T | null`. Callers that compare the result with `== null` / `!= null` see no change. Any caller that tests `=== undefined` changes with the function, in the same PR.

## Acceptance criteria

- [ ] `first`, `last`, `zip` and `valuesAt` answer `null` for Ruby's `nil`, with each signature returning `T | null` (or `(T | null)[]`), and the MRI citations above in their JSDoc.
- [ ] Tests cover the `nil` arm of each: an empty array for `first` / `last`, a short argument for `zip`, a missing key for `valuesAt`.
- [ ] Every caller across `packages/*/src` that tests one of these results against `undefined` is converged in the same PR (grep `=== undefined` / `!== undefined` near these calls), and `pnpm build` is green.
