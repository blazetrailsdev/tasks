---
title: "delegate-missing-to-writer-arm-without-guard"
status: draft
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
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

`Delegation.generateMethodMissing` (`packages/activesupport/lib/delegation.ts`) ports `delegate_missing_to`'s `method_missing` (`vendor/rails/v8.0.2/activesupport/lib/active_support/delegation.rb`) as a Proxy layer. trails#10458 added a `set` trap so `obj.foo = v` reaches the target's `foo=`, as Ruby's `method_missing` does. A JS property write cannot be told apart from a Ruby ivar assignment (`this.maze = maze` in a constructor), so the trap reads the target under a `resolvingWriters` re-entrancy guard and falls back to an own write when the target read throws (`Cavern` in `test/core-ext/module.test.ts`). Both arms are invented.

## Acceptance criteria

- [ ] The writer arm forwards only Ruby `foo=` calls, with no re-entrancy guard or catch on the target read, or the operator rules the shape permanent.
