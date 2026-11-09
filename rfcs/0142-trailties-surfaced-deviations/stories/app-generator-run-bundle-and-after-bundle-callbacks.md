---
title: "app-generator-run-bundle-and-after-bundle-callbacks"
status: in-progress
updated: 2026-11-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9921
claim: "2026-11-09T15:35:24Z"
assignee: "solid-queue-retry-all-accepts-job-arrays"
blocked-by: null
closed-reason: null
---

## Context

`AppGenerator.apply_rails_template(template, destination)`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:331-337`) ends with
`generator.run_bundle` and `generator.run_after_bundle_callbacks`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`). trails'
`AppGenerator.applyRailsTemplate` (`packages/trailties/src/generators/rails/app/app-generator.ts`) stops after
`applyRailsTemplate`. The call gate does not flag this: both calls have a local receiver, so
rails-api.json files them under `weakCalls`. trails#9565 removed the stale receipts. The `app:template` command (`packages/trailties/src/commands/app.ts`) drains
`pendingGenerators` itself, a trails-only stand-in for the after-bundle callbacks.

## Acceptance criteria

- [ ] `AppBase#runBundle` and `#runAfterBundleCallbacks` are ported (the package-manager install
      standing in for `bundle install`), and `AppGenerator.applyRailsTemplate` calls both.
- [ ] The `pendingGenerators` drain in
      `commands/app.ts` converges onto `run_after_bundle_callbacks`.
