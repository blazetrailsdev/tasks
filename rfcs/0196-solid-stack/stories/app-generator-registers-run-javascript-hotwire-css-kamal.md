---
title: "app-generator-registers-run-javascript-hotwire-css-kamal"
status: in-progress
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10215
claim: "2026-11-16T22:51:35Z"
assignee: "app-database-yml-templates-add-solid-databases"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AppGenerator` registers `public_task :run_javascript`, `:run_hotwire`, `:run_css`, `:run_kamal` before `:run_solid`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:570-578`). trails ports those methods in
`packages/trailties/lib/generators/app-base.ts` (`runJavascript`, `runHotwire`, `runCss`) but
`packages/trailties/lib/generators/trails/app/app-generator.ts` registers only `runInstall`, `generateBundlerBinstub` and
`runSolid` (trails#10186). So `trails new` never runs `vite:install` / `turbo:install stimulus:install`, and the ported
"default generator executes all trails commands" test (`railties/test/generators/app_generator_test.rb:1021-1029`) expects
only `credentials:diff --enroll` and the Solid install.

## Acceptance criteria

- Register `runJavascript`, `runHotwire`, `runCss`, `runKamal` with `publicCommand` in Rails' order, before `runSolid`.
- `runJavascript`'s default arm runs `vite:install` (root CLAUDE.md § importmap-rails and propshaft are out of scope).
- Extend the expected list in "default generator executes all trails commands" to Rails' shape.
