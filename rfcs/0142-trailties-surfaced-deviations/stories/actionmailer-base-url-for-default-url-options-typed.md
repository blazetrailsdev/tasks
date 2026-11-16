---
title: "ActionMailer::Base includes AbstractController::UrlFor (typed defaultUrlOptions)"
status: done
updated: 2026-11-16
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10193
claim: "2026-11-16T17:36:39Z"
assignee: "action-cable-engine-defined-in-actioncable-package"
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
