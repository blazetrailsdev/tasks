---
title: "trails-tsc finds mailer views by ActionMailer::Base subclass, not -mailer.ts suffix"
status: in-progress
updated: 2026-11-23
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#10641
claim: "2026-11-23T13:52:26Z"
assignee: "homepage-view-typecheck-virtualizer-gaps"
blocked-by: null
closed-reason: null
---

## Context

trails#10627 added `allMailers` / `isMailerView` to `packages/trails-tsc/lib/build-views.ts`. They tell a mailer view by the `app/mailers/**/*-mailer.ts` file suffix, so a mailer view's shim leaves out `ApplicationController`'s `_helpers` (turbo installs its helpers only on controllers, `vendor/turbo-rails/v2.0.23/lib/turbo/engine.rb:55-58`). Rails does not require the suffix: `class Notifier < ApplicationMailer` is a mailer, and its views are typed with controller helpers today. A mailer layout is told only by a `layouts/*mailer` name, where Rails' `layout "mailer"` (`railties/lib/rails/generators/rails/app/templates/app/mailers/application_mailer.rb.tt`) can name any layout.

## Acceptance criteria

- A class under `app/mailers/` that descends from `ActionMailer::Base` is a mailer whatever its file name, found the way `bindCheckedTypes` already resolves controllers through the checker, or by its `extends` chain.
- A layout a mailer names through `layout` gets no controller helpers.
- `build-views.test.ts` covers an unsuffixed mailer and a mailer-named layout.
