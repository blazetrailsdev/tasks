---
title: "Preview params accept ActionController::Parameters"
status: draft
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer::Preview#initialize(params = {})` and `.call(email, params = {})`
(`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/preview.rb:72-76,88-94`) take
any params object; `Rails::MailersController` passes `ActionController::Parameters`
(`vendor/rails/v8.0.2/railties/lib/rails/mailers_controller.rb:25,40`). The port types
`params` as `Record<string, unknown>` (`packages/actionmailer/src/preview.ts:80-95`),
so `packages/trailties/src/mailers-controller.ts` (download / preview) passes
`this.params as never`.

## Acceptance criteria

- `Preview`'s constructor, `params` reader and `call` accept an
  `ActionController::Parameters` (or a structural type it satisfies) as well as a
  plain object, with the Rails default `{}`.
- The two `this.params as never` casts in `mailers-controller.ts` are removed.
