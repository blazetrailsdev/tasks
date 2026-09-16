---
title: "Converge OrderedHash.from onto Hash.[] (splat, nil padding, ArgumentError)"
status: draft
updated: 2026-09-16
rfc: "0101-activesupport-out-of-closure-surface"
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

Rails `ActiveSupport::OrderedHash[...]` is `Hash.[]` (`vendor/ruby/hash.c`
`rb_hash_s_create`): with a single array-of-arrays argument a one-element
pair pads its value with `nil`, and an odd flat argument list raises
`ArgumentError` ("odd number of arguments for Hash").
`activesupport/test/ordered_hash_test.rb:222-238` asserts both
(`alternate initialization with splat` uses flat `[1, 2, 3, 4]`,
`with array` passes `["missing value"]`).

trails' `OrderedHash.from` (`packages/activesupport/src/ordered-hash.ts`)
accepts only complete `[k, v]` pairs and throws a plain `Error` otherwise,
so trails#7832's test had to pass `["missing value", null]` and pairs instead
of a flat splat.

## Acceptance criteria

- A `Hash.[]`-shaped class constructor (flat splat, array-of-pairs with nil
  padding, `ArgumentError` on odd args) replaces `OrderedHash.from`.
- `ordered-hash.test.ts` passes Rails' literal inputs for the three
  alternate-initialization tests.
