---
title: "assertMatch skips assert_respond_to :=~ and returns void instead of Regexp.last_match"
status: draft
updated: 2026-09-23
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
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

Surfaced by trails#7998. Minitest's `assert_match`
(`vendor/minitest/lib/minitest/assertions.rb:271-278`) does
`assert_respond_to matcher, :=~` before matching and returns
`Regexp.last_match`. trails' private `assertMatch`
(`packages/activesupport/src/testing/assertions.ts`) skips the respond-to
assertion (one fewer counted assertion) and returns `void`.
`ActiveSupport::Testing::Assertions#assert_raises(match:)`
(`active_support/testing/assertions.rb:34-38`) is its only caller today and
ignores the return value.

## Converged shape

`assertMatch` asserts the matcher responds to `=~` (String and Regexp both do)
and returns the match data (`RegExp#exec` result / `null`).

## Acceptance criteria

- [ ] Assertion count and return value match Minitest.
