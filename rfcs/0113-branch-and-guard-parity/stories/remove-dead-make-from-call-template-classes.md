---
title: "remove-dead-make-from-call-template-classes"
status: done
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 25
pr: 7535
claim: "2026-09-05T20:51:57Z"
assignee: "skeleton-throw-token-carries-the-raised-class"
blocked-by: null
closed-reason: null
---

# Remove the dead `make` helper from the CallTemplate classes

## Context

`packages/activesupport/src/callbacks.ts` gives every `CallTemplate` subclass a
`make(target, value)` method — `MethodCall` (:186), `ObjectCall` (:227),
`InstanceExec0` (:250), `InstanceExec1` (:275), `InstanceExec2` (:306).

Rails has no `make` on any of them
(`vendor/rails/activesupport/lib/active_support/callbacks.rb:340-484`): a
`CallTemplate` answers `expand`, `make_lambda` and `inverted_lambda` only. It is
not on trails' own `CallTemplate` interface either, and a repo-wide grep finds
no caller — it is dead invented surface.

`ProcCall`'s copy was removed by the `proc-call-override-target-name-and-fallback`
PR while converging that class; the other five were left because they are outside
that story's file region.

## Acceptance criteria

- [ ] `make` is gone from `MethodCall`, `ObjectCall`, `InstanceExec0`,
      `InstanceExec1` and `InstanceExec2`.
- [ ] `pnpm parity:api:extra --package activesupport` shows five fewer novel
      names in `callbacks.ts`.
- [ ] `pnpm vitest run packages/activesupport/src/callbacks` green.
