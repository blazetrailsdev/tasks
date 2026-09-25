---
title: "Logger#add evaluates a block message; BroadcastLogger#log is add's alias"
status: in-progress
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8079
claim: "2026-09-25T03:24:24Z"
assignee: "activesupport-assert-match-drops-respond-to-and-last-match"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `broadcast-logger-method-missing-dup-and-kwargs` (trails#8045).

Ruby's `Logger#add` (`vendor/ruby/lib/logger.rb:651-663`) takes a block and
evaluates it when `message` is nil (`if message.nil?; if block_given?; message = yield`).
`Logger#log` is `alias log add`. trails' `Logger#add`
(`packages/activesupport/src/logger.ts:101`) has no block arm: only `Logger#log`
(`logger.ts:120`) evaluates a function-valued message and then calls `add`.

Because of that split, `BroadcastLogger#log` (`packages/activesupport/src/broadcast-logger.ts`)
dispatches each broadcast's `log` where Rails' `alias_method :log, :add`
(`activesupport/lib/active_support/broadcast_logger.rb:116-119`) makes `log`
the same method as `add`, which calls each logger's `add`.

## Acceptance criteria

- [ ] `Logger#add(severity, message = nil, progname = nil, &block)` takes a
      trailing block and evaluates it per `logger.rb:659-663`; `log` is the
      alias of `add`, not a separate body.
- [ ] `BroadcastLogger#log` is `add` (the `alias_method`), dispatching `logger.add(...)`.
- [ ] Existing logger / broadcast-logger tests stay green.
