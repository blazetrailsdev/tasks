---
title: "delegation-has-trap-raises-on-prototype-proxy"
status: in-progress
updated: 2026-11-01
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9568
claim: "2026-11-01T12:42:40Z"
assignee: "app-base-app-name-and-shebang"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/delegation.ts` `generateMethodMissing`'s `has` trap reads the target off `obj`, because a `has` trap has no receiver. Over a prototype (`Attachment`, built with `delegateMissingTo`) `obj` is the prototype, so `blob` reaches `associationInstanceGet` with no `_associationCache` and raises TypeError. Any `in` probe that misses does this, including vitest's `expect(attachment).not.toBe(...)`. Rails: `delegate_missing_to` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/delegation.rb`) answers `respond_to_missing?` on the instance. `packages/activestorage/src/attached/one.test.ts`'s "duped record does not share attachments" compares with `===` to avoid it.

## Acceptance criteria

- `in` on a record whose prototype carries the Proxy does not raise.
- The dup test reads `expect(duped).not.toBe(...)`, as `assert_not_equal` does in `one_test.rb:689`.
