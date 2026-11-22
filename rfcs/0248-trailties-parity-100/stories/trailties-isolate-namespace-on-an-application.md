---
title: "trailties-isolate-namespace-on-an-application"
status: blocked
updated: 2026-11-22
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-22T00:33:34Z"
assignee: "engine-controllers-resolve-for-unused-routes"
blocked-by: "needs operator decision: what Ruby module AppTemplate maps to in a trails app (story Context)"
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/multiple_applications_test.rb:133` "isolate namespace on an application" is the one test of that file left unported (the rake-tasks and generators tests landed with the bundle that closed `trailties-multiple-applications-rake-tasks-and-isolate-namespace`).

Rails: `Rails.application.isolate_namespace(AppTemplate)` (`railties/lib/rails/application.rb:388-390`) forwards to `Engine.isolate_namespace` (`railties/lib/rails/engine.rb:385-410`), which defines `railtie_namespace` on the module; `Railtie#railtie_namespace` (`railties/lib/rails/railtie.rb:266-268`) then finds it via `self.class.module_parents.detect`.

trails: the generated app (`packages/trailties/lib/generators/trails/app/templates/config/application.ts.tt`) is a bare `class AppTemplate extends Application` with no enclosing module, so `moduleParents(AppTemplate)` (`packages/activesupport/lib/module-ext.ts:249`) is `[Object]`, and `Engine.isolateNamespace` (`packages/trailties/lib/engine.ts:110`) skips defining `railtieNamespace` because the class already answers it through Trailtie's class->instance delegation. Needs an operator decision on what `AppTemplate` (the Ruby module) maps to in a trails app.

## Acceptance criteria

- [ ] "isolate namespace on an application" is ported into `packages/trailties/test/application/multiple-applications.test.ts` with its Rails name and body and passes.
