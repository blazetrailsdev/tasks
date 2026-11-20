---
title: "Converge DispatcherTest polling/sleeps bodies and rewind_io to v1.7.2"
status: draft
updated: 2026-11-20
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/dispatcher.test.ts` still differs from `vendor/solid_queue/v1.7.2/test/unit/dispatcher_test.rb`:

- "polling queries are logged" (`:77-90`): Rails calls `rewind_io(log)` before start and `wait_while_with_timeout(3.seconds) { !log.string.match?(polling_query) }`; trails does a fixed `sleep(0.2)`.
- "polling queries can be silenced" (`:92-103`): missing `rewind_io(log)`.
- "sleeps `0.seconds` between polls…": trails keeps an extra trailing `sleep(0.1)` and a mocked `interruptibleSleep`; converge to the v1.7.2 body.
  Needs `stringio-truncate` (ruby-compat) for `rewind_io`.

## Acceptance criteria

- Port `rewind_io` as the private helper at `:190-193` and the three bodies verbatim against v1.7.2.
- File passes 50/50 repeated runs locally.
