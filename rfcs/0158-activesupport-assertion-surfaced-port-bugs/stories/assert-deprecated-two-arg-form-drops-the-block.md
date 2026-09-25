---
title: "assertDeprecated(deprecator, block) drops the block; port Rails' two-argument form"
status: done
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8079
claim: "2026-09-25T03:24:24Z"
assignee: "activesupport-assert-match-drops-respond-to-and-last-match"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::Testing::Deprecation#assert_deprecated`
(`activesupport/lib/active_support/testing/deprecation.rb:30-31`) is
`def assert_deprecated(match = nil, deprecator = nil, &block)`, and its first line is
`match, deprecator = nil, match if match.is_a?(ActiveSupport::Deprecation)`. The block is a
separate slot, so the two-argument form `assert_deprecated(ActiveRecord.deprecator) do … end` works.
It is the form `connection_handling_test.rb:113-133` uses.

trails' port (`packages/activesupport/src/testing/deprecation.ts:8-14`,
`assertDeprecated(match, deprecator?, block?)`) takes the block as the third positional argument.
Its swap line `if (match instanceof Deprecation) [match, deprecator] = [null, match];` therefore
turns `assertDeprecated(deprecator(), fn)` into deprecator = the Deprecation, block = `undefined`.
The block is dropped, and the TS signature rejects the call anyway (TS2345). Every caller has to
spell Rails' two-argument form as `assertDeprecated(null, deprecator(), fn)`: about 23 call sites
under `packages/`, including `connection-handling.test.ts` since trails#8021.

## Acceptance criteria

- `assertDeprecated(deprecator, block)` works like Rails' `assert_deprecated(deprecator) { }`. When
  the first argument is a `Deprecation`, the function slot shifts into `block`, via an overload set
  that keeps Rails' `(match, deprecator, block)` order for the three-argument form.
- The `assertDeprecated(null, deprecator(), …)` call sites whose Rails line is the two-argument form
  are rewritten to `assertDeprecated(deprecator(), …)`.
- `packages/activesupport/src/testing/deprecation.test.ts` covers both forms.
