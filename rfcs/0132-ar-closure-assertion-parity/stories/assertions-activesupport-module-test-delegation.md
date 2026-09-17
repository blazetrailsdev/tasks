---
title: "assertions-activesupport-module-test-delegation"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These are the rows left after `assertions-activesupport-module-class-remainder`.
Only `core_ext/module_test.rb` (16 rows) still reports mismatches.

- `private delegate`, `private delegate prefixed`,
  `private delegate with private option`,
  `some public some private delegate with private option`, and
  `private delegate prefixed with private option` (`module_test.rb:500-589`)
  assert `assert_not_respond_to` and `respond_to?(m, true)`. CLAUDE.md
  § "Method visibility is not a runtime fact in JS" says this cannot be
  observed in JS, so decide per test whether the assertion ports, for example
  through `Module#delegate`'s `private:` bookkeeping.
- `delegation arity to self class` (`module_test.rb:650`) asserts
  `instance_method(...).arity` for eleven delegators.
- `delegation line number` / `delegate line with nil` use `source_location`.
- `delegation to method that exists on nil` (with and without `allow_nil`)
  expects `0.0` from `nil.to_f`.

## Acceptance criteria

- `core_ext/module_test.rb` reports 0 count/kind/value mismatches, or each
  residual row cites the CLAUDE.md section that rules out porting it.
