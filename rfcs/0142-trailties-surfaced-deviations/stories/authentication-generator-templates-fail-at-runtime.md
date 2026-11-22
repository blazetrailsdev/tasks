---
title: "authentication-generator-templates-fail-at-runtime"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
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

`trails generate authentication` (packages/trailties/lib/generators/trails/authentication/) emits code that
fails at run time in a generated app (found building examples/chatter):

- `app/views/sessions/new.html.tse` reads `params().get(...)` and `(await flash()).get(...)`. In a view,
  `params` is a property and `flash` a getter answering a promise
  (packages/actionpack/lib/action-controller/metal/flash.ts:86), so both raise
  `__lookup(...) is not a function`. Rails' template is `params[:email_address]` / `flash[:alert]`
  (vendor/rails/v8.0.5.2/railties/lib/rails/generators/erb/authentication/templates/app/views/sessions/new.html.erb).
- The generated `app/mailers/application-mailer.ts` is a plain class with `defaultFrom` / `layout` fields
  instead of `class ApplicationMailer extends ActionMailer::Base` with `default from:` and `layout "mailer"`
  (railties/lib/rails/generators/rails/app/templates/app/mailers/application_mailer.rb.tt).
- `Current` delegates `user` to `session`, but `session.user` is an awaited association read in trails, so
  `Current.user` answers a promise.

## Acceptance criteria

- A freshly generated app with `trails generate authentication` renders `/session/new` and signs in.
- The application-mailer template extends `ActionMailer.Base` with `default` / `layout` calls.
- A generator test covers the rendered sessions view.
