---
title: "emit-autoload-lib-from-trails-new"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
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

`Configuration#autoloadLib` is ported (see
`packages/trailties/src/application/configuration.ts`), but the `trails new`
application template still omits the
`config.autoload_lib(ignore: %w[assets tasks])` line Rails emits
(`vendor/rails/railties/lib/rails/generators/rails/app/templates/config/application.rb.tt:17-21`).

The blocker is timing, not the method. Rails' `config.root` is resolved
eagerly in the class body (`Application::Configuration#root` is
`@root ||= find_root(...)`), so `root.join("lib")` answers there. trails
resolves the root asynchronously — `Application.findRoot` is `async`
(`packages/trailties/src/application.ts:87-90`) and `Application#initialize`
pins `config.root` only once the initializer chain starts — so
`Application.config.root` is still `null` inside a generated
`static { ... }` block and `autoloadLib` would join against `null`.
`config.loadDefaults("8.0")` needs no root and IS emitted today.

## Acceptance criteria

- The generated `src/config/application.ts` calls
  `config.autoloadLib({ ignore: ["assets", "tasks"] })` at a point where
  `config.root` is resolved, without inventing a seam Rails does not have.
- The `app-generator` snapshot is updated.
