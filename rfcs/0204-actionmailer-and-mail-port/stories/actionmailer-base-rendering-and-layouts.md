---
title: "actionmailer-base-rendering-and-layouts"
status: in-progress
updated: 2026-11-04
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9734
claim: "2026-11-04T22:21:41Z"
assignee: "actionmailer-base-rendering-and-layouts"
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer::Base` includes `AbstractController::Rendering`, `Logger`,
`Helpers`, `Translation`, `AssetPaths`, `Callbacks`, `Caching` and
`ActionView::Layouts`, sets `PROTECTED_IVARS` and calls
`helper ActionMailer::MailHelper`
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:487-500`), and
defines `instrument_payload` / `instrument_name` / `_protected_ivars`
(`base.rb:1050-1065`).

trails' `packages/actionmailer/src/base.ts` has none of these includes:
`Base#mail`'s template and block paths (`collectResponsesFromBlock`,
`collectResponsesFromTemplates`, `eachTemplate`) call `this.render` and
`this.lookupContext`, which are only declared on the `interface Base`, so a
mailer without `body:` fails at run time. `base_test.rb`'s template-backed tests
(`welcome`, `html_only`, implicit/explicit multipart, layouts, i18n subject) need
this plus the `test/fixtures/base_mailer/*.erb` templates as `.tse` fixtures.

## Acceptance criteria

- `Base` includes the Rails modules above in Rails' order; `PROTECTED_IVARS`,
  `instrumentPayload`, `instrumentName`, `_protectedIvars` ported.
- A mailer action with no `body:` renders its template through `mail`.
- `base_test.rb`'s template-backed tests port with Rails names.
