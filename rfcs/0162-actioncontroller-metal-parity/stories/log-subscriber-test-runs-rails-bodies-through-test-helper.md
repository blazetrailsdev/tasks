---
title: "log_subscriber_test.rb: all 34 tests run Rails' bodies through LogSubscriber::TestHelper"
status: ready
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8570. `packages/actionpack/src/action-controller/controller/log-subscriber.test.ts`
is name-matched to `vendor/rails/v8.0.2/actionpack/test/controller/log_subscriber_test.rb`, but only the
14 tests ported in #8570 run Rails' bodies. The other 20 (`start processing`, `halted callback`,
`process action`, `redirect to`, `send data`, `send file`, the three `...includes http status code`
tests, ...) build a `NotificationEvent` by hand and call the subscriber method directly, where Rails
does `get :show; wait` and asserts on `logs` (`log_subscriber_test.rb:129-413`).

The file also carries a hand-rolled `CaptureLogger` and a `vi.spyOn(LogSubscriber, "logger")`, where
Rails does `include ActiveSupport::LogSubscriber::TestHelper` (`log_subscriber_test.rb:105`). The port
exists at `packages/activesupport/src/log-subscriber/test-helper.ts` (trails#8565) but activesupport
exports no subpath for it, so actionpack cannot import it.

The controller is missing `data_sender`, `file_sender`, `with_rescued_exception` and
`with_action_not_found` (`log_subscriber_test.rb:44-90`).

## Acceptance criteria

- [ ] `@blazetrails/activesupport/log-subscriber/test-helper` is importable from actionpack (every
      subpath registration the repo requires).
- [ ] The describe mixes in `TestHelper` (`setup` / `teardown` / `wait` / `set_logger`) and reads
      `logger.logged(":info")`; `CaptureLogger` and the `vi.spyOn` are gone.
- [ ] All 34 tests run Rails' bodies through `get` / `post`, with Rails' assertion counts.
- [ ] The controller has every action `log_subscriber_test.rb:8-97` defines.
