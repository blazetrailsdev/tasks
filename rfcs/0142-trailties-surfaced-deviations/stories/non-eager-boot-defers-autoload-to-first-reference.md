---
title: "non-eager-boot-defers-autoload-to-first-reference"
status: draft
updated: 2026-11-27
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

trailties boots with an awaited `eagerLoad` at the end of `setup_main_autoloader` / `setup_once_autoloader` (`packages/trailties/lib/application/finisher.ts`), whatever `config.eager_load` says. trailties `CLAUDE.md` § "The application loader is Zeitwerk" ratified this because constant lookup is synchronous and a load is not. Rails autoloads on first reference (`vendor/rails/v8.0.5.2/railties/lib/rails/application/finisher.rb:36-50`), so three ported tests can't pass:

- `packages/trailties/test/application/loading.test.ts` "dependencies reloading is followed by routes reloading" and "routes reloading triggers after_routes_loaded" (`vendor/rails/v8.0.5.2/railties/test/application/loading_test.rb`). The body reads `'NaN'`: `app/models/user.ts` runs `counter += 1` at boot, before `config/routes.ts` seeds `counter`. Rails loads `User` from inside the route's block, after the routes are drawn.
- `packages/trailties/test/application/zeitwerk-integration.test.ts` "reloading clears autoloaded tracked classes" (`zeitwerk_integration_test.rb:312-341`). `Dependencies._autoloadedTrackedClasses` holds 27 classes: every eager-loaded app and engine class (ApplicationController, ApplicationJob, ActionMailbox and ActiveStorage controllers and jobs, ...), where Rails holds `Set[Child, Grandchild]`. The finisher's `on_load` tracking matches `finisher.rb:38-42`.

- `zeitwerk-integration.test.ts` "the once autoloader can autoload from initializers" (`zeitwerk_integration_test.rb:101-135`). `extras0` and `extras1` are not eager-load paths, so `setup_once_autoloader` (`packages/trailties/lib/application/bootstrap.ts`) marks them `doNotEagerLoad`, and `constGet(TopLevel, "Y")` in `config/initializers/autoload-y.ts` raises `uninitialized constant Y`.

These tests are parked `BLOCKED:` on this story (trails#10854).

## Acceptance criteria

- The operator decides whether a non-eager boot can defer loading to first reference (a synchronous `constGet` reaching a constant that is not yet loaded), or whether these arms are permanently unportable. If unportable, they are re-parked as `PERMANENT-SKIP:` citing the ratified section.
- If the boot is converged, the four tests pass unmodified.
