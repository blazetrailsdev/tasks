---
title: "port-trails-autoloaders"
status: blocked
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: null
claim: "2026-09-03T11:34:47Z"
assignee: "port-trails-autoloaders"
blocked-by: "No Zeitwerk to port: Rails::Autoloaders (railties/lib/rails/autoloaders.rb:12-28) is a pair of Zeitwerk::Loader instances, and Zeitwerk's whole mechanism is Ruby constant resolution (Module#autoload / const_missing) at reference time. ESM resolves nothing from a constant name and offers no hook for an unresolved identifier, so there is no loader graph for Trails.autoloaders to hold; zeitwerk is also not vendored under vendor/, so a port would be invented surface with no Ruby source to mirror. What trails has instead is the eager directory scan (loadControllers in trailties/src/application/finisher.ts). Unblock if a trails autoloader concept is decided on; autoloadLib's @missingRailsCall ignore tag stays pointed here."
closed-reason: null
---

## Context

`Configuration#autoloadLib`
(`packages/trailties/src/application/configuration.ts`) ports
`Rails::Application::Configuration#autoload_lib`
(`vendor/rails/railties/lib/rails/application/configuration.rb:471-481`) —
but only the two path pushes. Rails' last line,
`Rails.autoloaders.main.ignore(ignored_abspaths)` (`:480`), has no trails
receiver: there is no `Trails.autoloaders` (`packages/trailties/src/rails.ts`
defines no such accessor, and nothing in `packages/trailties/src` mentions
Zeitwerk or an autoloader). The gap carries a
`@missingRailsCall ignore — CONVERGEABLE port-trails-autoloaders` tag at the
call site.

Rails' surface is `Rails.autoloaders` →
`Rails::Autoloaders` (`railties/lib/rails/autoloaders.rb`), a `main` /`once`
pair of Zeitwerk loaders, wired by
`railties/lib/rails/application/finisher.rb` (`:setup_main_autoloader`) and
`bootstrap.rb`. `autoload_lib_once` (`configuration.rb:483-493`) is the twin
that needs `Rails.autoloaders.once` and is also unported.

## Acceptance criteria

- `Trails.autoloaders` exists with Rails' `main` / `once` shape, or the
  decision that trails' ESM module graph makes it unportable is recorded with
  `tasks block`.
- `autoloadLib` calls `ignore` and the `@missingRailsCall` tag is deleted.
- `autoloadLibOnce` is ported alongside it.
