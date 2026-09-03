---
title: "emit-autoload-lib-from-trails-new"
status: blocked
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: "2026-09-03T11:34:47Z"
assignee: "port-trails-autoloaders"
blocked-by: "config.root is null in a generated static { } block: Application.findRoot is async (trailties/src/application.ts:104-107) and config.root is pinned only once the initializer chain starts (application.ts:215-220), so autoloadLib's path.join(this.root, 'lib') (application/configuration.ts:412) would join against null exactly where Rails' eager @root ||= find_root answers (application/configuration.rb:472). Every seam that would make the call work — an app-class initializer, a top-level await pinning config.setRoot before the call — is a seam Rails does not have, which the acceptance criteria rule out. Unblock when trails has a synchronous root, or when the async-root deviation is ratified with a home for the call."
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
