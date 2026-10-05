---
title: "activesupport: assert_difference drops the respond_to?(:call) arms for String expressions"
status: draft
updated: 2026-10-05
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`assert_difference` (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/assertions.rb`, `def assert_difference`)
takes two arms the port does not:

```ruby
exps = expressions.keys.map { |e|
  e.respond_to?(:call) ? e : lambda { eval(e, block.binding) }
}
…
code_string = code.respond_to?(:call) ? _callable_to_source_string(code) : code
```

`packages/activesupport/src/testing/assertions.ts#assertDifference` accepts callables only: `exps` is
`[...expressions.keys()]` and the message always calls `_callableToSourceString(exp)`. The arms report hid this
until trails#8547 taught the extractor to read the `typeof args[args.length - 1] === "function" ? args.pop() : undefined`
block capture as a binding; the pair now reads `-if +loop` in `pnpm parity:api:arms:report --package=activesupport`.
The `+loop` is the awaited `before = exps.map(&:call)`.

`assert_no_difference` / `assert_changes` share the `respond_to?(:call)` shape; check them in the same pass.

## Acceptance criteria

- [ ] Decide the String-expression arm from the Ruby: `eval(e, block.binding)` has no JS counterpart (no binding
      object), so either the String arm is ported over an explicit evaluator the caller supplies, or it is
      receipted as a language shortcoming at the declaration with the Rails cite. The `code.respond_to?(:call) ? … : code`
      message arm is ported either way.
- [ ] The `before` collection is written in the shape the extractor reads as `map` (`awaitedCollect`), so no invented loop is reported.
- [ ] `assertDifference` shows no row in the activesupport arms report, and the Rails tests in
      `activesupport/test/testing/assertions_test.rb` (or wherever `assert_difference` with a String expression is tested) that can be ported are.
