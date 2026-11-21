---
title: "trails-internal-controllers-autoload-after-boot"
status: draft
updated: 2026-11-21
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

# Trails internal controllers load after boot, as rails.rb autoloads them

## Context

Rails autoloads `Rails::InfoController`, `MailersController`, `WelcomeController` and eager-autoloads `HealthController` / `PwaController` (`vendor/rails/v8.0.2/railties/lib/rails.rb:30-37`). `Rails::ApplicationController` (`vendor/rails/v8.0.2/railties/lib/rails/application_controller.rb:3-4`) is required by them, so its class body (`prepend_view_path`) runs after `Engine`'s `add_view_paths` on_load hook (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:617`) has prepended `app/views` onto `ActionController::Base`.

In trails, `packages/trailties/lib/trails.ts:23-26` and `packages/trailties/lib/constants.generated.ts` import `application-controller.ts`, `info-controller.ts`, `welcome-controller.ts` and `pwa-controller.ts` eagerly, so `ApplicationController.prependViewPath` (`application-controller.ts:33`) snapshots Base's view paths before boot. trails' `Autoload#autoload` (`packages/activesupport/lib/dependencies/autoload.ts`) records `_autoloads` but nothing resolves them on first reference. `lib/trailties/action-mailer.ts`'s `action_mailer.base` initializer imports `mailers-controller.js` during boot, which Rails doesn't do.

This blocks `mailers-controller-view-paths-miss-app-views`.

## Acceptance criteria

- `Trails.autoload` declarations mirror `rails.rb:30-37`, and the internal controllers' modules are evaluated only after `add_view_paths` has run (on first reference, or at `eagerLoadBang` for the eager set).
- `Trails.ApplicationController.viewPaths()` in a booted app contains the app's `app/views`.
