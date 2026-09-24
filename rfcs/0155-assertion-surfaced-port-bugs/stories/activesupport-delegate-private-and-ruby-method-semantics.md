---
title: "Module#delegate private: option, nil-receiver methods and source_location are unported (9 parked tests)"
status: blocked
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-23T23:33:09Z"
assignee: "activesupport-delegate-private-and-ruby-method-semantics"
blocked-by: "Language shortcoming, ratified in CLAUDE.md § 'Method visibility is not a runtime fact in JS': the 5 private-delegate tests need respond_to?(m) and respond_to?(m, true) to differ, and basicObjRespondTo's pub cannot be read. source_location (module_test.rb:365,370) has no JS Method#source_location; arity -1 (module_test.rb:650) cannot be expressed by Function.length. The nil-receiver tests (module_test.rb:341,346) are already unskipped and green on main."
closed-reason: null
---

## Context

Parked by the assertion-parity burndown (RFC 0132, story `assertions-activesupport-module-class-third-pass`). Each test below keeps its Rails-converged body as `it.skip` with `// BLOCKED: activesupport-delegate-private-and-ruby-method-semantics` in `packages/activesupport/src/core-ext/module.test.ts`. Cause is established from reading the port, not by fixing it.

- `private delegate`, `private delegate prefixed`, `private delegate with private option`, `some public some private delegate with private option`, `private delegate prefixed with private option` (`vendor/rails/activesupport/test/core_ext/module_test.rb:500-590`): Rails asserts `assert_not_respond_to place, :street` for a delegate made private (via `private(*delegate(...))` or `delegate ..., private: true`, `activesupport/lib/active_support/core_ext/module/delegation.rb`). `delegate` in `packages/activesupport/src/module-ext.ts` has no `private:` option, so the method is public and `assertNotRespondTo` fails. Note CLAUDE.md "Method visibility is not a runtime fact in JS": the fix needs a decision on what a private delegate means here before it is coded.
- `delegation to method that exists on nil`, `... when allowing nil` (`module_test.rb:341,346`): Rails `nil_person.to_f` is `0.0` because `nil.to_f` exists. The port delegates to JS `null`, which has no `toF`, so it raises `DelegationError` / returns `undefined`.
- `delegation line number`, `delegate line with nil` (`module_test.rb:365,370`): `Someone.instance_method(:foo).source_location` line equals `FAILED_DELEGATE_LINE`. JS has no `Method#source_location`; the parked body reads a non-existent `.sourceLocation`. Probably not convergeable.
- `delegation arity to self class` (`module_test.rb:650`): asserts `instance_method(:opt).arity == -1` for optional/kwargs methods. A JS `Function.length` cannot express Ruby's `-1`. Probably not convergeable.

## Acceptance criteria

- Decide per bullet: converge, or `pnpm tasks block` with the specific language blocker. The two source_location tests and the arity `-1` assertions are the likely blocks.
- Un-skip each converged test and remove its `BLOCKED:` line.
