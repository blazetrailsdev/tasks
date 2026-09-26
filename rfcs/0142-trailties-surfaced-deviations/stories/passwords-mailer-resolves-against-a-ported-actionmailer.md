---
title: "passwords-mailer-resolves-against-a-ported-actionmailer"
status: blocked
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: "No ActionMailer port: packages/ has no actionmailer package on origin/main (ls packages/), and the story's AC is phrased 'once ActionMailer is ported'. Porting ActionMailer is an explicit non-goal of this RFC (README § Non-goals; owner RFC 0123). Unblocks when @blazetrails/actionmailer exists."
closed-reason: null
---

## Context

`AuthenticationGenerator#createAuthenticationFiles`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`)
now templates `passwords_mailer.rb`, both `reset.*.erb` views and the preview
unconditionally, as Rails does
(`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:22-29`).

But there is no `@blazetrails/actionmailer` package. The emitted
`PasswordsMailer` (`templates.ts`, `app/mailers/passwords_mailer.rb` entry)
extends `ApplicationMailer` from `./application-mailer.js`, which `AppGenerator`
does not create (it skips `ActionMailer`, `app-base.ts:31`), and calls
`this.mail(...)`, which nothing defines. `PasswordsController#create`'s
`PasswordsMailer.reset(user).deliverLater()` therefore does not resolve in a
generated app, and `tsc` over the generated app reports
`Cannot find module './application-mailer.js'`.

The template's static `reset` shim stands in for ActionMailer's
`method_missing` class-level dispatch (`actionmailer/lib/action_mailer/base.rb`).

## Acceptance criteria

- Once ActionMailer is ported, `trails new` emits `app/mailers/application_mailer`
  and the emitted `PasswordsMailer` resolves against it.
- `PasswordsController#create`'s `PasswordsMailer.reset(user).deliverLater()`
  type-checks and delivers through the real mailer.
- The static `reset` shim in the template is replaced by whatever the
  ActionMailer port's class-level action dispatch is.
