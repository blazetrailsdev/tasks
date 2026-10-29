---
title: "app-generator-run-bundle-and-after-bundle-callbacks"
status: draft
updated: 2026-10-29
rfc: "0171-thor-port"
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

`AppGenerator.apply_rails_template(template, destination)`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:331-337`) ends with
`generator.run_bundle` and `generator.run_after_bundle_callbacks`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb`). trails'
`AppGenerator.applyRailsTemplate` (`packages/trailties/src/generators/app-generator.ts`) stops after
`applyRailsTemplate` and carries `@missingRailsCall run_bundle` / `run_after_bundle_callbacks`
receipts. The `app:template` command (`packages/trailties/src/commands/app.ts`) drains
`pendingGenerators` itself, a trails-only stand-in for the after-bundle callbacks.

## Acceptance criteria

- [ ] `AppBase#runBundle` and `#runAfterBundleCallbacks` are ported (the package-manager install
      standing in for `bundle install`), and `AppGenerator.applyRailsTemplate` calls both.
- [ ] The two `@missingRailsCall` receipts are deleted and the `pendingGenerators` drain in
      `commands/app.ts` converges onto `run_after_bundle_callbacks`.
