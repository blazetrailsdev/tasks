---
title: "assertValidKeys message text should match Rails Hash#assert_valid_keys (#inspect symbols)"
status: ready
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
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

`assertValidKeys` (`packages/activesupport/src/hash-utils.ts:189`) now raises
the correct `ArgumentError` type (PR #4566), but the message text still
diverges from Rails. Ruby's `Hash#assert_valid_keys`
(`vendor/rails/activesupport/lib/active_support/core_ext/hash/keys.rb:52`)
builds the message with `#inspect` on each symbol:

```ruby
raise ArgumentError.new("Unknown key: #{k.inspect}. Valid keys are: #{valid_keys.map(&:inspect).join(', ')}")
```

so Rails produces `Unknown key: :failore. Valid keys are: :failure, :funny`
(note the leading `:` colons from symbol inspection — see
`vendor/rails/activesupport/test/core_ext/hash_ext_test.rb:254`, which asserts
the exact string). trails currently emits `Unknown key: failore. Valid keys
are: failure, funny` — no colons — because TS keys are plain strings.

## Acceptance criteria

- [ ] Decide the trails-faithful rendering of the message (keys are strings in
      TS, so a literal `:` prefix may or may not be desired) and converge the
      `assertValidKeys` message toward Rails' `hash_ext_test.rb:254` expectation.
- [ ] Update `packages/activesupport/src/hash-ext.test.ts` and
      `collections.test.ts` `assert_valid_keys` cases to assert the exact
      message string (currently they only regex-match a fragment).
