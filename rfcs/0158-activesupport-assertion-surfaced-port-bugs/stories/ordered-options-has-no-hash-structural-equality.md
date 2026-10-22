---
title: "OrderedOptions does not compare equal to a Hash of the same contents (Hash#==)"
status: draft
updated: 2026-09-28
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`ActiveSupport::OrderedOptions < Hash`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/ordered_options.rb:30`)
inherits `Hash#==`, so Rails asserts an OrderedOptions tree against a plain
Hash: `assert_equal ({ good: true, bad: false, nested: { foo: "bar" } }), @credentials.something`
(`activesupport/test/encrypted_configuration_test.rb:47`).

trails' `OrderedOptions` (`packages/activesupport/src/ordered-options.ts`)
is a plain class (not a `Hash` subclass) that stores its entries in a
private `data` Map behind a Proxy. Since trails#8224, `assertEqual` compares
through ruby-compat's `rbEqual`, which has no `Hash#==` arm for an
OrderedOptions. So trails#8197's assertion still reads
`{ ...creds.something.toH(), nested: creds.something.nested.toH() }`
(`encrypted-configuration.test.ts:51`, "reading configuration by key file").

## Converged shape

OrderedOptions answers `Hash#==` (`rb_hash_equal`, `vendor/ruby/v3.3.11/hash.c`)
through the `==` hook `rbEqual` dispatches to, comparing its pairs with a Hash
or plain object of the same contents, recursively. The test then asserts with
the CONTRIBUTING.md `assert_equal` row for a value with Ruby `==`
(`expect(rbEqual(act, exp)).toBe(true)` or `toEqualRuby`) on `creds.something`.

## Acceptance criteria

- `rbEqual({ a: 1, nested: { b: 2 } }, orderedOptionsTree)` is true for an
  equal nested tree and false for an unequal one, in both argument orders.
- The `toH()` reconstruction in `encrypted-configuration.test.ts` is replaced
  by `creds.something`.
