---
title: "assertNoDifference drops a block passed in the message slot"
status: draft
updated: 2026-11-11
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
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

Rails `assert_no_difference(expression, message = nil, &block)` and
`assert_difference(expression, *args, &block)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb:101-163`) take the block by
syntax, so the optional `message` can be omitted. In trails,
`packages/activesupport/lib/testing/assertions.ts`'s `assertNoDifference(expression, message = null, block)`
takes the block positionally. A call `assertNoDifference(expr, async () => ...)` binds the block to
`message`, never runs it, and passes vacuously. trails#9988 hit this. `assertDifference`'s
`(expr, 5, block)` overload type also rejects omitting `message`, though its runtime pops a trailing function.

## Acceptance criteria

- Per root CLAUDE.md § "An optional positional before trailing options or a block": `assertNoDifference`
  moves a function in the `message` slot across to `block` at the top of its body, and `assertDifference`'s
  overloads accept `(expression, difference, block)`.
- A regression test that fails on the current code: a `(expr, block)` call runs the block.
