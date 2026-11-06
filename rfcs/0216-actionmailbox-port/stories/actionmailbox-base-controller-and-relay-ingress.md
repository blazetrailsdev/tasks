---
title: "Port ActionMailbox::BaseController and the Relay ingress controller"
status: ready
updated: 2026-11-06
rfc: "0216-actionmailbox-port"
cluster: amb-ingress
packages: ["actionmailbox"]
deps:
  ["actionmailbox-engine-routes-and-trailties-wiring", "actionmailbox-test-helper-and-test-case"]
deps-rfc: []
est-loc: 300
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actionmailbox/app/controllers/action_mailbox/base_controller.rb:5-33`:
  `skip_forgery_protection`, `before_action :ensure_configured`; private
  `ensure_configured` (`head :not_found` unless `ActionMailbox.ingress ==
ingress_name`), `ingress_name` (the class name with
  `/\AActionMailbox::Ingresses::/` and `/::InboundEmailsController\z/`
  removed, `underscore.to_sym`), `authenticate_by_password`
  (`http_basic_authenticate_or_request_with`, realm "Action Mailbox", else
  `ArgumentError` "Missing required ingress credentials"), and `password`
  (`Rails.application.credentials.dig(:action_mailbox, :ingress_password) ||
ENV["RAILS_INBOUND_EMAIL_PASSWORD"]`).
- `ingresses/relay/inbound_emails_controller.rb:51-68`: `before_action
:authenticate_by_password, :require_valid_rfc822_message`; `create`;
  private `require_valid_rfc822_message` (`head :unsupported_media_type`).
- `test/test_helper.rb:30-47`: the `ActionDispatch::IntegrationTest`
  `credentials` / `switch_password_to` helpers.

`httpBasicAuthenticateOrRequestWith` exists
(`packages/actionpack/src/action-controller/metal/http-authentication.ts:68`).

Test: `test/controllers/ingresses/relay/inbound_emails_controller_test.rb` (7).

## Acceptance criteria

- Both controllers are ported line for line; `ingress_name` reads the class's
  Ruby name through `rbModName`, never a hand-written string.
- `create` awaits `createAndExtractMessageId` and the body read.
- The integration-test helpers live in the package's test support.
- The relay controller test passes, names verbatim.
