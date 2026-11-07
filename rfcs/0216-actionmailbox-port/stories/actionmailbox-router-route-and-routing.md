---
title: "Port ActionMailbox::Router, Router::Route and the Routing concern"
status: in-progress
updated: 2026-11-07
rfc: "0216-actionmailbox-port"
cluster: amb-core
packages: ["actionmailbox"]
deps: ["actionmailbox-test-helper-and-test-case"]
deps-rfc: []
est-loc: 400
priority: 5
pr: trails#9829
claim: "2026-11-07T12:47:05Z"
assignee: "actionmailbox-router-route-and-routing"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionmailbox/lib/action_mailbox/router.rb:8-43`: `RoutingError < StandardError`,
  `add_routes`, `add_route(address, to:)`, `route` (`mailbox.receive`, else
  `inbound_email.bounced!` and `raise RoutingError`), `mailbox_for`
  (`routes.detect { … }&.mailbox_class`), private `attr_reader :routes`.
- `router/route.rb:7-41`: `initialize(address, to:)` +
  `ensure_valid_address`; `match?`'s five arms (`:all`, String
  `casecmp?`, Regexp, Proc, `address.match?`); `mailbox_class`
  (`"#{mailbox_name.to_s.camelize}Mailbox".constantize`); the
  `ArgumentError` message "Expected a Symbol, String, Regexp, Proc, or
  matchable, got …".
- `routing.rb:5-25`: `cattr_accessor :router, default: Router.new` in
  `included`, and class methods `routing`, `route`, `mailbox_for`.

Test: `test/unit/router_test.rb` (15).

## Acceptance criteria

- Ported line for line; `match?` is `isMatch`, async because the String and
  Regexp arms read `inboundEmail.mail` (RFC Design).
- `:all` is the string `"all"` (a Ruby Symbol is a JS string); Ruby's
  `Symbol` arm in `ensure_valid_address` is the `typeof === "string"` test
  and keeps its order in the list.
- `mailbox_class` uses `constantize`, never a registry (RFC Design).
- `Routing` is a Concern with its `cattr_accessor` in the `included` hook and
  its `ClassMethods` through `extend()`.
- `router_test.rb` passes, names verbatim.
