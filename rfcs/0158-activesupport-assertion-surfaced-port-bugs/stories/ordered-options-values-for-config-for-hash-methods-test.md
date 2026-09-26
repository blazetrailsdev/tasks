---
title: "OrderedOptions lacks Hash#values, blocking config_for makes all hash methods available"
status: draft
updated: 2026-09-26
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8112 ported the `config_for` cases of `railties/test/application/configuration_test.rb` into `packages/trailties/src/application/configuration.test.ts`. It skipped `config_for makes all hash methods available` (`configuration_test.rb:2484-2501`), because `ActiveSupport::OrderedOptions` in trails (`packages/activesupport/src/ordered-options.ts`) does not answer all of the Hash methods that test uses:

```ruby
assert_equal({ foo: 0, bar: { baz: 1 } }, actual)
assert_equal([ :foo, :bar ], actual.keys)
assert_equal([ 0, baz: 1], actual.values)
assert_equal({ foo: 0, bar: { baz: 1 } }, actual.to_h)
assert_equal(0, actual[:foo])
assert_equal({ baz: 1 }, actual[:bar])
```

`OrderedOptions < Hash` (`activesupport/lib/active_support/ordered_options.rb`), so every Hash method is available. trails has `keys`, `toH`, `get` and (since #8112) `update`, but no `values`.

## Converged shape

Add `values()` to `OrderedOptions`, mirroring `Hash#values` (`vendor/ruby/hash.c` `rb_hash_values`). Then port the test under its Rails name.

## Acceptance criteria

- `OrderedOptions#values` exists and returns the values in insertion order.
- `config_for makes all hash methods available` is ported with Rails' six assertions.
