---
title: "Port the Rails conductor for ActionMailbox (controllers, views, layout)"
status: draft
updated: 2026-11-03
rfc: "0216-actionmailbox-port"
cluster: amb-engine
packages: ["actionmailbox"]
deps:
  [
    "actionmailbox-engine-routes-and-trailties-wiring",
    "actionmailbox-incineration-and-inbound-email-tests",
  ]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The conductor is ActionMailbox's development-only UI for creating, viewing,
rerouting and incinerating inbound emails. It has Rails tests and an owner in
`config/routes.rb:18-25`, so it is ported in the first wave.

- `vendor/rails/v8.0.2/actionmailbox/app/controllers/rails/conductor/base_controller.rb:5-13`: `layout
"rails/conductor"`, `before_action :ensure_development_env` (`head
:forbidden` unless `Rails.env.development?`).
- `conductor/action_mailbox/inbound_emails_controller.rb:6-40`: `index`,
  `new`, `show`, `create`; private `new_mail` (bcc `include_in_headers`,
  `add_file` per present attachment), `mail_params` (`params.expect(mail:
[…])`), `create_inbound_email`.
- `inbound_emails/sources_controller.rb:6-14`, `incinerates_controller.rb:7-13`,
  `reroutes_controller.rb:7-20` (private `reroute`: `pending!`, `route_later`).
- Views: `app/views/layouts/rails/conductor.html.erb` and
  `app/views/rails/conductor/action_mailbox/inbound_emails/{index,new,show}.html.erb`,
  `inbound_emails/sources/new.html.erb`.

Its routes (`config/routes.rb:18-25`) are drawn by
`actionmailbox-engine-routes-and-trailties-wiring`; the redirects read them
through `main_app` url helpers.

Test: `test/controllers/rails/action_mailbox/inbound_emails_controller_test.rb` (4).

## Acceptance criteria

- The five controllers are ported line for line under the `Rails::Conductor`
  namespace at their Rails paths; `ensure_development_env` reads
  `Trails.env`.
- The five views are `.tse` templates precompiled by `build-views`
  (CLAUDE.md § "Templates are precompiled").
- The conductor test passes, names verbatim.
