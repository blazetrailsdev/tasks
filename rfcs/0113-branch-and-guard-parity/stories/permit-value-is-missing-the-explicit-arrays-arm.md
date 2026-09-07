---
title: "permit-value-is-missing-the-explicit-arrays-arm"
status: draft
updated: 2026-09-07
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`permit_value` (`actionpack/lib/action_controller/metal/strong_parameters.rb:1361-1370`)
has **five** arms:

```ruby
def permit_value(value, filter, on_unpermitted:,  explicit_arrays:)
  if filter == EMPTY_ARRAY # Declaration { comment_ids: [] }.
    permit_array_of_scalars(value)
  elsif filter == EMPTY_HASH # Declaration { preferences: {} }.
    permit_hash(value, filter, on_unpermitted:, explicit_arrays:)
  elsif array_filter?(filter) # Declaration { comments: [[:text]] }
    permit_array_of_hashes(value, filter.first, on_unpermitted:, explicit_arrays:)
  elsif explicit_arrays # Declaration { user: { address: ... } } or { user: [:name, ...] } (only allows hash value)
    permit_hash(value, filter, on_unpermitted:, explicit_arrays:)
  elsif non_scalar?(value) # Declaration { user: { address: ... } } or { user: [:name, ...] }
    permit_hash_or_array(value, filter, on_unpermitted:, explicit_arrays:)
  end
end
```

trails' `permitValue`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:885-910`)
has four: the `elsif explicit_arrays` arm between the array-filter arm and the
`non_scalar?` arm is absent, so an `explicit_arrays: true` filter takes the
`non_scalar?` arm and reaches `permit_hash_or_array` where Rails goes straight
to `permit_hash` — i.e. an array value is permitted where Rails permits only a
hash value.

`explicitArrays` is already a named option in the file — `permitFilters`'s
signature (`strong-parameters.ts:815-819`) takes
`_options: { onUnpermitted?: ...; explicitArrays?: boolean }` and drops it on
the floor — and `permit_filters` defaults it to `true`
(`strong_parameters.rb:1130`), which is how `expect` differs from `permit`
(`permit` passes `explicit_arrays: false`, `strong_parameters.rb:1042`). So the
missing arm is also why the port's `expect` and `permit` share one code path
where Rails' differ.

Surfaced while converging `hash_filter` in PR #7591 (RFC 0113), which extracted
`permit_value` at the Rails name and threaded the port's options through it but
left the arm count alone as out of scope.

## Acceptance criteria

- [ ] `permitValue` has Rails' five arms, in Rails' order, with the
      `explicitArrays` arm calling `permitHash`.
- [ ] `explicitArrays` is threaded from `permitFilters` / `_permitFilters` down
      through `permitValue`, `permitHash`, `permitArrayOfHashes` and
      `permitHashOrArray` the way Rails threads the kwarg, rather than being
      accepted and dropped; `permit` passes `false` and `permit_filters`
      defaults it to `true` (`strong_parameters.rb:1042,1130`).
- [ ] The `parameters_expect_test.rb` "key to explicit array" tests
      (`vendor/rails/actionpack/test/controller/parameters/parameters_expect_test.rb:59-102`)
      are ported and green, since they are what the arm exists for.
- [ ] `pnpm parity:api:calls` / `parity:api:calls:args` / `parity:test:assertions` green.
