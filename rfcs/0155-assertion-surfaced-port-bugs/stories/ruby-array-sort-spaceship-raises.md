---
title: "Port Array#sort over <=> raising ArgumentError for base_test comparison tests"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8087
claim: "2026-09-25T14:51:41Z"
assignee: "reset-callbacks-test-helper-ships-in-production-callbacks"
blocked-by: null
closed-reason: null
---

## Context

`base_test.rb:666-670` and `:695-700` sort arrays with Ruby's `Array#sort`. When `<=>` returns `nil`, `sort` raises `ArgumentError` ("comparison of X with Y failed"). trails has no port of `Array#sort` over `<=>` in ruby-compat.

The ported tests in `packages/activerecord/src/base.test.ts` ("failed comparison of unlike class records", "comparison with different objects in array") use a comparator written in the test that throws `ArgumentError` itself. As a result, they only check that `Core#compare` returns `undefined`, not the raise.

## Acceptance criteria

- ruby-compat exports an `Array#sort`-over-`<=>` helper that raises `ArgumentError("comparison of <A> with <B> failed")` when `<=>` returns nil, matching MRI's message.
- Both base tests call that helper and do not throw from inside the test.
