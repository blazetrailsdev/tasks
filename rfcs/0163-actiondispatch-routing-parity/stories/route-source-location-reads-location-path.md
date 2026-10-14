---
title: "Mapping#routeSourceLocation guards on location.path, not absolutePath ?? path"
status: draft
updated: 2026-10-14
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:378-391`
(`Mapping#route_source_location`) guards with
`next if location.path.start_with?(action_dispatch_dir)`. trails'
`packages/actionpack/src/action-dispatch/routing/mapper.ts` `routeSourceLocation`
reads `(location.absolutePath ?? location.path).startsWith(actionDispatchDir)`,
an invented fallback arm. In trails `callerLocations` frames carry `path` as a
`file://` URL, so the plain `path` read never matches the fs dir and the port
compensates by preferring `absolutePath`.

## Acceptance criteria

- `routeSourceLocation` reads `location.path`, as Rails does, with no `??` arm,
  and `actionDispatchDir` is computed in the same form as `location.path` so
  the guard still skips action-dispatch frames.
- `routing-source-location.trails.test.ts` stays green.
