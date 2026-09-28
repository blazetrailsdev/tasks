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
stores its entries in a private `data` Map behind a Proxy. `assertEqual`'s
`deepEqual` (`packages/activesupport/src/testing/assertions.ts`) compares by
`JSON.stringify`, which serializes the instance as `{"data":{}}`. So trails#8197
had to write that assertion as
`{ ...creds.something.toH(), nested: creds.something.nested.toH() }`
(`encrypted-configuration.test.ts`, "reading configuration by key file").

## Converged shape

OrderedOptions compares equal to a Hash with the same contents, recursively,
as `Hash#==` does, through whatever hook `assertEqual` / `rbEqual` honours
(e.g. `asJson` / `toJSON` mirroring `Hash#as_json`, or a `==` / `eql` port).
The test then passes `creds.something` directly.

## Acceptance criteria

- `assertEqual({ a: 1, nested: { b: 2 } }, orderedOptionsTree)` passes for an
  equal nested tree and fails for an unequal one.
- The `toH()` reconstruction in `encrypted-configuration.test.ts` is replaced
  by `creds.something`.
