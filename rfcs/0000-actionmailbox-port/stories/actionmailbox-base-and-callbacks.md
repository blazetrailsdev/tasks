---
title: "Port ActionMailbox::Base and ActionMailbox::Callbacks"
status: draft
updated: 2026-11-03
rfc: "0000-actionmailbox-port"
cluster: amb-core
packages: ["actionmailbox"]
deps: ["actionmailbox-router-route-and-routing"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/base.rb:66-135`: includes `ActiveSupport::Rescuable`,
  `Callbacks`, `Routing`; `attr_reader :inbound_email`; `delegate :mail,
:delivered!, :bounced!, to: :inbound_email` and `delegate :logger, to:
ActionMailbox`; `self.receive`; `perform_processing` (`:83-94`,
  `Notifications.instrument "process.action_mailbox"` around
  `track_status_of_inbound_email` around `run_callbacks :process`, then
  `rescue_with_handler(exception) || raise`); `process`,
  `finished_processing?`, `bounce_with` (`deliver_later`), `bounce_now_with`
  (`deliver_now`); private `instrumentation_payload` and
  `track_status_of_inbound_email` (`processing!`, `delivered!` unless
  `bounced?`, `failed!` on raise); `run_load_hooks :action_mailbox`.
- `callbacks.rb:9-35`: `TERMINATOR`, `define_callbacks :process, terminator:,
skip_after_callbacks_if_terminated: true`, and `before_processing`,
  `after_processing`, `around_processing`.

Tests: `test/unit/mailbox/callbacks_test.rb` (3), `notifications_test.rb` (1),
`routing_test.rb` (3), `state_test.rb` (3). `bouncing_test.rb` is
`actionmailbox-bouncing-test`.

## Acceptance criteria

- `receive`, `perform_processing` and the `:process` run are async; the
  constructor is `constructor(inboundEmail)`.
- `delegate` is activesupport's `delegate`, writing `delivered!` /
  `bounced!` at their trails bang spellings.
- `bounce_with` / `bounce_now_with` await the message's delivery call; their
  test lands with the bouncing story.
- `finished_processing?` is `isFinishedProcessing`; private members are
  `private` + `@internal`.
- The four test files pass, names verbatim.
