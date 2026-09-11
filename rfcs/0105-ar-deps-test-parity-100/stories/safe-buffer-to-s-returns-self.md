---
title: "SafeBuffer#to_s returns self, and SafeBufferTest asserts its class"
status: draft
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::SafeBuffer#to_s` returns `self`
(`vendor/rails/activesupport/lib/active_support/core_ext/string/output_safety.rb:138-140`).
trails' `SafeBuffer` (`packages/activesupport/src/core-ext/string/output-safety.ts`)
has no `toS`. Because of that, `safe-buffer.test.ts` "Should return a safe
buffer when calling to_s" cannot assert Rails' class check
(`activesupport/test/safe_buffer_test.rb:46-49`,
`assert_equal ActiveSupport::SafeBuffer, @buffer.to_s.class`). Surfaced in trails#7708.

## Acceptance criteria

- Add `SafeBuffer#toS()` returning `this`, in Rails source order.
- Rewrite the test to Rails' shape: `expect(buffer.toS()).toBeInstanceOf(SafeBuffer)`.
