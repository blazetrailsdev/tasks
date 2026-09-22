---
title: "broadcast-logger-method-missing-dup-and-kwargs"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-loggers-cluster` (RFC 0132). Parked in
`packages/activesupport/src/broadcast-logger.test.ts` with converged bodies:

- `calling a method when *one* logger in the broadcast has implemented it`
- `calling a method when *multiple* loggers in the broadcast have implemented it`
- `calling a method when a subset of loggers in the broadcast have implemented`
- `calling a method that accepts a block` / `... accepts args` / `... accepts kwargs`
- `#dup duplicates the broadcasts`
- `# delegates keyword arguments to loggers`

Rails: `vendor/rails/activesupport/test/broadcast_logger_test.rb:246-320`, impl
`activesupport/lib/active_support/broadcast_logger.rb` (`method_missing` /
`respond_to_missing?` fan-out returning a single value or an array,
`initialize_copy` deep-duping `@broadcasts`, severity methods forwarding
`*args, **kwargs, &block`).

The port (`broadcast-logger.ts`) has no method_missing fan-out, no `dup` /
`initialize_copy`, and its `debug`..`unknown` take a single `message` so kwargs
never reach the inner loggers. Per CLAUDE.md "Records are not Proxies", a Proxy
here is decided per class — BroadcastLogger is not a record.

## Acceptance criteria

- [ ] The parked tests above are un-skipped and pass with their converged bodies.
- [ ] `dup()` duplicates each broadcast (Rails `initialize_copy`).
- [ ] Severity methods and `add` forward kwargs to inner loggers.
