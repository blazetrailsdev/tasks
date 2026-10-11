---
title: "Hash#merge! does not convert its argument with to_hash, so Parameters is not implicitly a Hash"
status: ready
updated: 2026-10-11
rfc: "0162-actioncontroller-metal-parity"
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

Ruby's `Hash#merge!` converts each argument with `to_hash` before merging
(`vendor/ruby/v3.3.11/hash.c`, `rb_hash_update_call`: `VALUE hash = to_hash(argv[i])`),
so an object that defines `to_hash` is implicitly a Hash there.
`ActionController::Parameters#to_hash`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`)
is that conversion, and
`vendor/rails/v8.0.2/actionpack/test/controller/parameters/parameters_permit_test.rb:467-472`
asserts it: `assert_equal({ a: 1 }, { a: 1 }.merge!(params))` for an empty,
permitted `Parameters`.

ruby-compat's `mergeBang` (`packages/ruby-compat/src/hash.ts`) reads its
argument as a plain object or `Hash` and never dispatches to a `toHash` member,
so `mergeBang({ a: 1 }, params)` copies the `Parameters` instance's own fields
into the receiver.

"parameters can be implicit converted to Hash" in
`packages/actionpack/src/action-controller/controller/parameters/parameters-permit.test.ts`
is parked `it.skip` under a `BLOCKED:` line naming this story, with the Rails
body kept.

## Acceptance criteria

- [ ] `mergeBang` (and `merge`, which Ruby routes through the same
      `rb_hash_update`) converts an argument that answers `toHash` by calling
      it, as `to_hash` does in `rb_hash_update_call`.
- [ ] The parked test is un-skipped and passes with the Rails body, without the
      cast on the `params` argument.
