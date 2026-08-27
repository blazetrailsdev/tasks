---
title: "arel: port NoMethodError so the four TypeError analogue sites drop their lint receipts"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7131 enrolled arel in `blazetrails/rails-error-parity`. Four sites throw a
native `TypeError` as the JS analogue of a Ruby `NoMethodError`, and each now
carries an `eslint-disable-next-line blazetrails/rails-error-parity` receipt
because there is no ported `NoMethodError` class to reach for:

- `packages/arel/src/visitors/visitor.ts:119` — `Cannot visit ...`, the
  `rescue NoMethodError` terminal at
  `vendor/rails/activerecord/lib/arel/visitors/visitor.rb:36-39`.
- `packages/arel/src/visitors/dot.ts:416` — `undefined method '<m>' for <klass>`
  in `visitEdge`; Ruby reaches the same message by plain `send`
  (`arel/visitors/dot.rb`).
- `packages/arel/src/nodes/node.ts:59` — ``undefined method `connection' for nil``
  when `Arel::Table.engine` is unset (`arel/nodes/node.rb:148-153` calls
  `engine.with_connection`).
- `packages/arel/src/predications.ts:174` — `groupingAny`/`groupingAll`
  dispatching to a host method by name (`arel/predications.rb`).

The eslint receipt is debt, not a decision: the converged shape is a ported
`NoMethodError` (Ruby core, raised throughout Rails) that these four sites
throw, after which all four receipts are deleted. Related 0023 stories in the
same class: `aggregate-mapping-miss-typeerror-vs-nomethoderror`,
`command-recorder-proxy-raises-nomethoderror`.

## Acceptance criteria

- A `NoMethodError` class exists at the trails home the Ruby-core error
  hierarchy maps onto, with Ruby's message shape
  (``undefined method `x' for <receiver>``).
- The four arel sites throw it, and the four
  `eslint-disable-next-line blazetrails/rails-error-parity` comments are gone.
- `pnpm eslint packages/arel/src --max-warnings 0` green with no exclude row.
- Any test asserting the current `TypeError` is updated to the Rails-faithful
  class without renaming the test.
