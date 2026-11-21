---
title: "trailties-multiple-applications-rake-tasks-and-isolate-namespace"
status: draft
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
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

Left unported from `vendor/rails/v8.0.2/railties/test/application/multiple_applications_test.rb`:

- `:76` "rake tasks defined on different applications go to the same class": `Trails.application.loadTasks()` in-process reaches `packages/trailties/lib/trailties/active-record.ts:189`, whose `import.meta.resolve(...)` is undefined under vitest's SSR transform (`__vite_ssr_import_meta__.resolve is not a function`).
- `:134` "isolate namespace on an application": `Trailtie#railtieNamespace` (`packages/trailties/lib/trailtie.ts:143`) answers the app class before `isolateNamespace`, where Rails answers nil (`railtie.rb` `railtie_namespace`, `module_parents.detect`). The generated app class `AppTemplate` has no enclosing module the way `AppTemplate::Application` does.
- `:116` "generators run on different applications go to the same class": `Engine#loadGenerators` (`packages/trailties/lib/engine.ts`) skips `require "rails/generators"` (`railties/lib/rails/engine.rb:477`), so `Trails.Generators` is unset in-process. A literal `import("./generators.js")` there reds `test/production-boot.trails.test.ts`, which keeps generators out of the boot graph, so the load needs a shape that guard accepts.

## Acceptance criteria

- [ ] All three tests are ported into `packages/trailties/test/application/multiple-applications.test.ts` with their Rails names and pass.
