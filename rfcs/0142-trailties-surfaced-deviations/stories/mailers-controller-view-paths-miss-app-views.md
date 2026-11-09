---
title: "mailers-controller-view-paths-miss-app-views"
status: draft
updated: 2026-11-09
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

# Rails::MailersController misses app/views because it loads before the action_controller on_load prepend

## Context

`Engine`'s `paths["app/views"]` initializer runs `ActiveSupport.on_load(:action_controller) { prepend_view_path(views) }` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:617`). `prepend_view_path` reassigns the `_view_paths` class attribute on `ActionController::Base`. `Rails::ApplicationController` (`vendor/rails/v8.0.2/railties/lib/rails/application_controller.rb:4`) and `Rails::MailersController` are autoloaded after that hook, so their own `prepend_view_path` builds on a PathSet that already holds `app/views`.

In trails, `packages/trailties/lib/application-controller.ts:33` and `packages/trailties/lib/mailers-controller.ts:187` run `prependViewPath` at import time, before the app boots. Each class seats its own `_viewPaths` without `app/views`, and the later prepend on Base never reaches it. `MailersController.renderer.renderToString("notifier/bar")` raises `MissingTemplate`.

## Acceptance criteria

- `Trails.MailersController` resolves templates under the application's `app/views`, as Rails' does.
- "mailer preview has access to rendering context" (`vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb:1085`) in `packages/trailties/test/application/mailer-previews.test.ts` is unskipped and passes.
