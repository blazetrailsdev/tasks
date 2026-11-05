---
title: "actionmailer-base-test-remaining-attachments-multipart-defaults"
status: claimed
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: "2026-11-05T21:36:24Z"
assignee: "actionmailer-base-test-remaining-attachments-multipart-defaults"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionmailer/src/base.test.ts` ports `vendor/rails/v8.0.2/actionmailer/test/base_test.rb`
through the observer / interceptor tests (`:670-818`). Still unported (38 tests):

- `mail()` with bcc/cc/...; `mail()` doesn't set the mailer as a controller in the execution context
- attachment with hash (+ default mail encoding); inline attachments (`can embed an inline attachment`, `... and other attachments`, `adding inline attachments while rendering mail works`, `accessing attachments works after mail was called`, `adding an inline attachment using a before_action`)
- implicit multipart with fallback locale / several view paths / inexistent templates; explicit multipart with format(Hash) / one part
- `calling deliver on the action ...` (2), template path for implicit lookup, asset_host (2)
- proc defaults (`:818-900`, 6 tests), before/after_action mail modification, anonymous mailer, default_from, `mail()` getter, notifications (2), preview interceptors (`:1045-1110`, 4), `all()` ordering, params

The `BaseMailer` actions these need (`test/mailers/base_mailer.rb`) must be re-added to
`packages/actionmailer/src/test-helpers/mailers/base-mailer.ts`, with fixtures from
`test/fixtures/base_mailer/`.

`delivery_methods_test.rb`'s `delivery method can be customized per instance` and
`does not perform deliveries if requested` are still `it.skip` in `delivery-methods.test.ts`.

`base_test.rb`'s `mail_side_effects` (`:1017-1024`) snapshots `Mail`'s
`@@delivery_notification_observers` / `@@delivery_interceptors`; trails' `mail.ts` keeps them
module-private, so the ported observer tests rely on unregistering instead.

## Acceptance criteria

- Port each test above under its Rails name, adding the matching `BaseMailer` actions and fixtures.
- Unskip the two delivery_methods tests or record why they stay skipped.
