---
title: "test-compare drops an enclosing module from a Ruby test class name"
status: draft
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package actionmailbox --wrong-describe` reports
`packages/actionmailbox/test/unit/test-helper.test.ts` as wrong-describe,
reading the Ruby side as `testhelpertest`. Rails nests the class in a module:
`module ActionMailbox` / `class TestHelperTest < ActiveSupport::TestCase`
(`vendor/rails/v8.0.2/actionmailbox/test/unit/test_helper_test.rb:5-6`), so the
Rails class path is `ActionMailbox::TestHelperTest`, which is the trails
describe. The test-compare Ruby extractor drops the enclosing `module` when
naming the test class (it handles `class A::B` but not `module A; class B`).
Found on trails#10495, whose story assumed the describe was wrong.

## Acceptance criteria

- [ ] The Ruby test extractor (`scripts/test-compare/`) qualifies a test class by its enclosing `module` blocks.
- [ ] `parity:test --package actionmailbox` reports 0 wrong describe with `describe("ActionMailbox::TestHelperTest")` unchanged.
- [ ] Any describe elsewhere renamed to match the old misread is found and reported.
