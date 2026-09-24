---
title: "rescuable-has-no-rescue-handlers-reader"
status: ready
updated: 2026-09-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-loggers-cluster` (RFC 0132). Parked in
`packages/activesupport/src/rescuable.test.ts` ›
`rescues defined later are added at end of the rescue handlers array`.

Rails `rescuable_test.rb:150-154` reads `@stargate.send(:rescue_handlers)` —
the `class_attribute :rescue_handlers` array of `[class_name, handler]` pairs
(`activesupport/lib/active_support/rescuable.rb`) — and asserts
`["WraithAttack", "WraithAttack", "NuclearExplosion", "MadRonon", "WeirdError"]`.
trails' `rescueFrom` (`module-ext.ts:268-300`) keeps handlers in a private
WeakMap with class/string keys and exposes no `rescueHandlers` reader; keys are
not stored as class names. `rescue_from` also should live in `rescuable.ts`
(Rails file) rather than `module-ext.ts`.

## Acceptance criteria

- [ ] `rescueHandlers` class attribute of `[name, handler]` pairs, appended in definition order and inherited by subclasses.
- [ ] Parked test un-skipped and passing.
