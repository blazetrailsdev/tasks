---
title: "Module#delegate: source_location and arity -1 are unported (3 parked tests)"
status: blocked
updated: 2026-09-23
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Parked by the assertion-parity burndown (RFC 0132, story `assertions-activesupport-module-class-third-pass`). Each test below keeps its Rails-converged body parked with `// BLOCKED: activesupport-delegate-private-and-ruby-method-semantics` in `packages/activesupport/src/core-ext/module.test.ts`. Cause is established from reading the port, not by fixing it.

- `delegation line number`, `delegate line with nil` (`vendor/rails/v8.0.2/activesupport/test/core_ext/module_test.rb:365,370`): `Someone.instance_method(:foo).source_location` line equals `FAILED_DELEGATE_LINE`. JS has no `Method#source_location`; the parked body reads a non-existent `.sourceLocation`. Probably not convergeable.
- `delegation arity to self class` (`module_test.rb:650`): asserts `instance_method(:opt).arity == -1` for optional/kwargs methods. A JS `Function.length` cannot express Ruby's `-1`. Probably not convergeable.

Settled, and no longer part of this story:

- The five private-delegate tests (`private delegate`, `private delegate prefixed`, `private delegate with private option`, `some public some private delegate with private option`, `private delegate prefixed with private option`, `module_test.rb:500-590`) assert `assert_not_respond_to place, :street` for a delegate made private. trails carries no method visibility at run time (CLAUDE.md § "Method visibility is compile-time only"), so trails#8317 parked them as `PERMANENT-SKIP:` and registered them in `scripts/parity/unported-files/activesupport.ts`. `delegate`'s `private:` option is accepted and has no run-time effect.
- `delegation to method that exists on nil`, `... when allowing nil` (`module_test.rb:341,346`) are unskipped and green on main.

## Acceptance criteria

- Decide per bullet: converge, or keep the story blocked on the specific language blocker (`Method#source_location`; `Method#arity`'s `-1`).
- Un-skip each converged test and remove its `BLOCKED:` line. No test here is to be converged by adding a run-time visibility carrier.
