---
title: "routes-command-boots-app-instead-of-importing-route-file"
status: draft
updated: 2026-08-30
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

`trails routes` reads the route FILE and expects it to export a `routes`
object with an `inspect()` method
(`packages/trailties/src/commands/routes.ts:11-38`), but the app generator
writes `export function drawRoutes(mapper: Mapper): void`
(`packages/trailties/src/generators/app-generator.ts:413-427`) and the runtime
route loader (`packages/trailties/src/engine.ts:195`) consumes that shape. So a
freshly generated app prints
`Routes file does not export a routes object with inspect().` instead of its
route table.

Rails does not read the route file at all. `Rails::Command::RoutesCommand#perform`
(`railties/lib/rails/commands/routes/routes_command.rb:23-34`) calls
`boot_application!`, then inspects the booted app:

```ruby
def perform(*)
  boot_application!
  require "action_dispatch/routing/inspector"
  say inspector.format(formatter, routes_filter)
end

def inspector
  ActionDispatch::Routing::RoutesInspector.new(Rails.application.routes.routes)
end
```

The boot half already exists in trails as `requireApplication`
(`packages/trailties/src/commands/server.ts:50-73`), which #7262 collapsed to a
single `config/application` spelling.

Surfaced while reviewing #7262 (generator-src-layout-vs-engine-paths), which
moved this command's lookup off the removed `src/` layout but deliberately left
the module-shape mismatch — that is a port of `RoutesCommand#perform`, not a
layout change.

## Acceptance criteria

- `routesCommand` boots the application and formats
  `Trails.application.routes.routes`, mirroring `RoutesCommand#perform` /
  `#inspector` rather than importing the route file.
- `trails routes` prints the route table for a default `trails new` app.
- `-g/--grep` keeps working; `--controller` / `--expanded` / `--unused` stay out
  of scope unless the inspector already supports them.
