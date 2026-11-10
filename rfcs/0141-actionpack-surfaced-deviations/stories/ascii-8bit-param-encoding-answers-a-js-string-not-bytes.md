---
title: "ascii-8bit-param-encoding-answers-a-js-string-not-bytes"
status: draft
updated: 2026-11-10
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param_encoding :create, "body-mime", Encoding::ASCII_8BIT`
(`vendor/rails/v8.0.2/actionmailbox/app/controllers/action_mailbox/ingresses/mailgun/inbound_emails_controller.rb:50`)
makes `params.require("body-mime")` a binary String, which Active Storage uploads byte for byte.
trails' `CustomParamEncoder.encodeForTemplate`
(`packages/actionpack/lib/action-dispatch/request/utils.ts:65-92`) answers a
one-character-per-byte JS string for ASCII-8BIT, so the Mailgun ingress
uploads it as UTF-8 and every byte >= 0x80 doubles. Root CLAUDE.md § "A String
has no encoding tag either" rules an ASCII-8BIT String a `Uint8Array` end to end.

Parked test: `receiving an inbound email from Mailgun with non UTF-8 characters`
in `packages/actionmailbox/src/controllers/ingresses/mailgun/inbound-emails-controller.test.ts`
(Rails `test/controllers/ingresses/mailgun/inbound_emails_controller_test.rb:28-44`).

## Acceptance criteria

- An ASCII-8BIT `param_encoding` yields a `Uint8Array` param (Rails
  `actionpack/lib/action_dispatch/request/utils.rb` `CustomParamEncoder`), and
  the Mailgun ingress passes it through to `create_and_extract_message_id!`.
- The parked Mailgun test is un-skipped and passes.
