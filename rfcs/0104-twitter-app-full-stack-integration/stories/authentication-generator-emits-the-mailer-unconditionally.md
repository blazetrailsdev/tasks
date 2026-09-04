---
title: "authentication-generator-emits-the-mailer-unconditionally"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `create_authentication_files` templates the mailer, both reset views and
the mailer preview unconditionally
(`railties/lib/rails/generators/rails/authentication/authentication_generator.rb:22-29`):

```ruby
template "app/mailers/passwords_mailer.rb"
template "app/views/passwords_mailer/reset.html.erb"
template "app/views/passwords_mailer/reset.text.erb"
template "test/mailers/previews/passwords_mailer_preview.rb"
```

trails' `AuthenticationGenerator` defaults `skipMailer` to `true`
(`packages/trailties/src/generators/rails/authentication/authentication-generator.ts`),
so a default run emits none of them. The reason is that there is no
`@blazetrails/actionmailer` package: the emitted `PasswordsMailer` extends
`ApplicationMailer` from `./application-mailer.js`, which `AppGenerator` does
not create, and `PasswordsController#create` calls
`PasswordsMailer.reset(user).deliverLater()`. Emitting the files by default
today would put unresolvable imports into every generated app, which is why the
existing test is named "skips the mailer and channel files while their packages
are unported".

(The Action Cable arm is NOT this: Rails itself guards it with
`if defined?(ActionCable::Engine)` at `:26`, and trails has no actioncable
package, so `skipActionCable` defaulting to true IS Rails' condition.)

## Acceptance criteria

- Once ActionMailer is ported, `createAuthenticationFiles` templates
  `passwords_mailer.rb`, both `reset.*.erb` views and
  `passwords_mailer_preview.rb` unconditionally, as `:22-29` does.
- `skipMailer` stops defaulting to `true`; the `api` arm around the two views
  is kept only if Rails keeps it.
- The existing test "skips the mailer and channel files while their packages
  are unported" is updated to the Action Cable arm alone — its name changes only
  if Rails has a counterpart name to take.
- `PasswordsController#create`'s `PasswordsMailer.reset(user).deliverLater()`
  resolves against the real mailer.
