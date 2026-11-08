---
title: "ActionMailer::Base includes AbstractController::UrlFor (typed defaultUrlOptions)"
status: draft
updated: 2026-11-08
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/railtie.rb:38` has `include AbstractController::UrlFor`
inside `on_load(:action_mailer)`, which gives `ActionMailer::Base` its `default_url_options` class_attribute.
In trails, `action_mailer.set_configs` assigns `defaultUrlOptions` onto `ActionMailer::Base` at runtime,
but the `Base` type has no such static. `packages/trailties/src/application/initializers/frameworks.test.ts`
("allows me to configure default URL options for ActionMailer") reads it through an `as unknown as` cast.

## Acceptance criteria

- `ActionMailer::Base` includes `AbstractController::UrlFor` as the railtie does, so `defaultUrlOptions` is a typed static.
- The cast in `frameworks.test.ts` is removed.
