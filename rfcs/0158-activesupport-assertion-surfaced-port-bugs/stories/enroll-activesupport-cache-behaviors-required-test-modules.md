---
title: "Enroll activesupport cache behaviors/ modules in the test extractor's REQUIRED_TEST_MODULES"
status: draft
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9210 taught `scripts/test-compare/extract-ruby-tests.rb` to emit a test
module's cases for each file that `include`s it from a `require_relative`
sibling (`collect_required_modules`, enrolled by name in
`REQUIRED_TEST_MODULES`). It is enrolled only for actioncable
(`CommonSubscriptionAdapterTest`, `ChannelPrefixTest`).

activesupport's cache store tests take the same shape. For example,
`vendor/rails/v8.0.2/activesupport/test/cache/stores/memory_store_test.rb` does
`require_relative "../behaviors"` and then `include CacheStoreBehavior`,
`CacheIncrementDecrementBehavior` and so on from `test/cache/behaviors/*.rb`.
Enrolling every module adds about 284 Rails cases to activesupport (3343 → 3627),
raises matches 3001 → 3024, and raises assertion-count mismatches 1 → 16 and
kind mismatches 3 → 25. That would red the assertion ratchet, which is why the
modules were left out.

## Acceptance criteria

- [ ] Each cache `behaviors/` module name is added to `REQUIRED_TEST_MODULES`.
- [ ] The ported TS cache store tests carry those shared cases with Rails' assertions, so `parity:test:assertions` stays at or below its base.
- [ ] activesupport's `parity:test` matched count does not drop.
