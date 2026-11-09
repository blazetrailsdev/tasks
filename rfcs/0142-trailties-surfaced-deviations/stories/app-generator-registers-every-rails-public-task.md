---
title: "AppGenerator registers every Rails public_task after apply_trails_template"
status: draft
updated: 2026-11-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `AppGenerator` registers `public_task :apply_rails_template, :run_bundle, :add_bundler_platforms, :generate_bundler_binstub, :run_javascript, :run_hotwire, :run_css, :run_kamal, :run_solid`, and then defines `run_after_bundle_callbacks` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:569-582`). The trails `AppGenerator` static block (`packages/trailties/lib/generators/trails/app/app-generator.ts`, near `this.publicCommand("runInstall")`) registers only `runInstall`, `generateBundlerBinstub` and `runAfterBundleCallbacks`. So `runJavascript`, `runHotwire`, `runCss` and `runSolid`, which are ported in `app-base.ts`, never run during `trails new`. `add_bundler_platforms` and `run_kamal` have no port.

Rails' `test_after_bundle_callback` (`railties/test/generators/app_generator_test.rb:1153-1162`) is also unported. It needs the generator test harness to record bundle commands, which Rails does through `@bundle_commands`.

## Acceptance criteria

- The `AppGenerator` command list matches `app_generator.rb:569-582` in the same order. Each step is registered at its Rails name (`addBundlerPlatforms` and `runKamal` are either ported or have a cited reason they are absent).
- `test_after_bundle_callback` is ported as "after bundle callback".
