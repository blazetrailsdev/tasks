---
title: "Generator test for both arms of the generated app's test script"
status: draft
updated: 2026-11-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10662 made the generated app's `test` script
(`packages/trailties/lib/generators/trails/app/templates/package.json.tt:24`)
`vitest run --project unit` when `dependsOnSystemTest()` is true, and `vitest run` otherwise.
This mirrors Rails' default exclude of `test/{system,dummy,fixtures}`
(`vendor/rails/v8.0.5.2/railties/lib/rails/test_unit/runner.rb:118`) and the `unit` project in
`vite.config.ts.tt:9-29`. No generator test pins either arm, so the `--skip-system-test` arm
broke and only the Generated App Tests smoke job caught it.

## Acceptance criteria

- A trails-only app-generator test (not in a Rails-named test) asserts that the default
  generated `package.json` uses `"vitest run --project unit"`, and that `--skip-system-test`
  uses `"vitest run"`.
