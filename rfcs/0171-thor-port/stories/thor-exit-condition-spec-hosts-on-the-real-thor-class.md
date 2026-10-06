---
title: "Thor exit_condition spec hosts on the real Thor class, not a test-local stand-in"
status: done
updated: 2026-10-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8563
claim: "2026-10-06T00:09:34Z"
assignee: "strong-parameters-missing-methods-and-invented-surface"
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/spec/exit_condition_spec.rb:5-18` builds `Class.new(Thor)` with `desc` and `define_method`.

`packages/trailties/src/thor/exit-condition.test.ts` (trails#8469) was ported before `thor.rb` was, so it declares
a local `class Thor` with minimal `desc` (`thor.rb:54-63`), `createCommand` (`thor.rb:560-583`) and `dispatch`
(`thor.rb:484-528`), including `Base` and extending `ClassMethods` by hand. Those three are not the Thor bodies.

Depends on `port-thor-class-dsl` and `port-thor-dispatch-and-help`.

## Acceptance criteria

- [ ] `exit-condition.test.ts` subclasses the ported `Thor` and the local `class Thor` is deleted.
- [ ] The case still asserts `SystemExit` and `epiped`, and `parity:test --package thor` still matches it 1/1.
