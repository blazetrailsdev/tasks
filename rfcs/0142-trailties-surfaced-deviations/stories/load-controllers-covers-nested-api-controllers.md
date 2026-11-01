---
title: "loadControllers is tested on a nested API controller"
status: draft
updated: 2026-11-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`loadControllers` in `packages/trailties/src/application/finisher.ts:212` (`@noRailsEquivalent PERMANENT`) scans `ActionController.Metal` subclasses and `defineController` (`:227`) walks to the base. Rails reaches this through `AbstractController::Railties::RoutesHelpers` and `ActionController::Helpers.inherited` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/helpers.rb`), which sets the helpers path per subclass. The trails#9425 review asked whether an API controller skips that hook, and its regression test covers only a top-level `PingsController`, not a nested prefix such as `posts/likes`.

## Acceptance criteria

- A test loads a nested controller (`posts/likes`) under an application and asserts its route dispatches.
- If `Helpers.inherited` work is skipped for API controllers, it converges toward Rails' behaviour, or the skip is shown to have no observable effect.
