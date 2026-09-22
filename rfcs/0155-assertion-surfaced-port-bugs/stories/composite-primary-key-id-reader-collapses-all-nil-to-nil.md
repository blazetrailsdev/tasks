---
title: "composite-primary-key-id-reader-collapses-all-nil-to-nil"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
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

`AttributeMethods::PrimaryKey#id` is `_read_attribute(@primary_key)`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/primary_key.rb:19-21`),
and for a composite primary key that reads every pk column, so a brand-new
record answers an array of `nil`s rather than `nil`. `#to_key` then wraps it:
`key = id; Array(key) if key` (:11-14), and `[nil, nil]` is truthy in Ruby.

`vendor/rails/activerecord/test/cases/primary_keys_test.rb:32-36`
(`test_to_key_with_composite_primary_key`) asserts exactly that:

```ruby
order = Cpk::Order.new
assert_equal [nil, nil], order.to_key
```

trails' `readId` (`packages/activerecord/src/attribute-methods/primary-key.ts:47-50`)
hands the array to `_readAttribute`, which answers `null` when every pk column
is unset, so `new CpkOrder().toKey()` is `null` where Rails gives `[nil, nil]`.
Reading `id` back after `order.id = [1, 2]` works, so only the all-unset case
diverges. The port is parked `it.skip` with
`BLOCKED: composite-primary-key-id-reader-collapses-all-nil-to-nil` in
`packages/activerecord/src/primary-keys.test.ts`.

## Acceptance criteria

- `new CpkOrder().id` is `[null, null]`, and `new CpkOrder().toKey()` is
  `[null, null]`.
- The parked `to key with composite primary key` test is un-skipped and passes.
