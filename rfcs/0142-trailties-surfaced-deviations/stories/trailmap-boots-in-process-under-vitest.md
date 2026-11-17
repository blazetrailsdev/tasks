---
title: "trailmap boots its application in-process under vitest via setLoadImporter"
status: draft
updated: 2026-11-17
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

trails#10221 added `setLoadImporter` (`packages/ruby-compat/lib/load.ts`), and the generated `config/environment.ts` (`packages/trailties/lib/generators/trails/app/templates/config/environment.ts.tt`) now calls `setLoadImporter((url) => import(url))`. With that, `rbFLoad` loads config/initializers, routes and seeds in vite's module graph under vitest, as Rails' `load_config_initializer` uses the test process's own `load` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb`). Inside trails nothing exercises this end to end, because trails' own vitest config aliases every package to its source.

trailmap (a `trails new` app) still works around the old behaviour. `test/helpers/app-helpers-in-views.test.ts` spawns `tsx scripts/app-helpers-probe.ts` as a child process, and `test/support/controller-test-case.ts` imports `config/application.js` and `config/routes.js` without running the initializers.

## Acceptance criteria

- trailmap vendors a trails at or after trails#10221, and its `config/environment.ts` calls `setLoadImporter((url) => import(url))` as the template does.
- trailmap's tests `import "config/environment.js"` and boot in-process. The child-process probe and the initializer-skipping controller test setup are deleted.
- A trailmap initializer that imports an app `.ts` module by its `.js` specifier boots inside a vitest test.
