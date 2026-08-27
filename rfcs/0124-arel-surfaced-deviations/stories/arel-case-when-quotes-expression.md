---
title: "arel: Case#when quotes its expression where Rails stores it raw"
status: draft
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: invented-arm
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Arel::Nodes::Case#when(condition, expression = nil)` stores `expression` raw
(`vendor/rails/activerecord/lib/arel/nodes/case.rb:14-17`:
`When.new(Nodes.build_quoted(condition), expression)`); only `#then`
(case.rb:19-22) and `#else` (case.rb:24-27) run `build_quoted` on the value.

`packages/arel/src/nodes/case.ts:35-40` quotes both:
`new When(buildQuoted(condition), buildQuoted(result === undefined ? null : result))`.
So `Case.new(x).when(a, "foo")` holds a `String` on the Rails side (and renders
through `visit_String` → `unsupported`) but a `Quoted("foo")` here; and
`Case.new(x).when(a)` holds `nil` in Rails but `Quoted(nil)` here, so `eql?` /
`hash` of a half-built Case differ from Rails. `parity:api:calls:args:report`
already surfaces this row (`nodes/case.ts#when new(ref:whenNode, ref:thenNode)`
vs Rails `new(ref:buildQuoted, ref:expression)`) but classifies it as naming, so
the gate stays green.

Same file, same method: the parameter is `expression` in Rails and `result`
here (case.rb:14, case.rb:24 vs case.ts:35, case.ts:42); the constructor's
`expression` is `operand` (case.rb:8 vs case.ts:22).

## Acceptance criteria

- `Case#when` passes its second argument through unquoted, exactly
  `new When(buildQuoted(condition), expression)`.
- Parameters renamed to Rails' `expression` in `when` / `else` / the
  constructor (`default` is a reserved word; keep `defaultValue` with a one-line
  note).
- `nodes/case.test.ts` stays green; the `calls:args` naming row for
  `nodes/case.ts#when` disappears from `pnpm parity:api:calls:args:report`.
