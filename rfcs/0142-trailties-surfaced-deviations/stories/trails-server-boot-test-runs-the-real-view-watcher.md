---
title: "trails server is tested booting the boot-app with its real view watcher"
status: in-progress
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10474
claim: "2026-11-21T02:40:39Z"
assignee: "mailers-controller-view-paths-miss-app-views"
blocked-by: null
closed-reason: null
---

# trails server is tested booting the boot-app with its real view watcher

## Context

trails#9366 made `buildViews` load `config/routes.ts`, and `trails server`
runs `buildViews` in-process through `watchViews`
(`packages/trailties/src/commands/server.ts`) after `Trails.initialize()`.
That combination crashed every development boot with a named route
(`Invalid route name, already in use`), fixed in trails#9382. No test caught it:
`commands/server.trails.test.ts` and `application/server.test.ts` both
`vi.mock("@blazetrails/trails-tsc")`, so `watchViews` never runs against a
booted application, and the boot-app tests call `Trails.initialize()` without
the server command.

## Acceptance criteria

- A `.trails.test.ts` runs `serverCommand()` in development against the
  boot-app fixture with the real `@blazetrails/trails-tsc` (only the listener
  — `DevServer#start` / `Handler.Node.run` — stubbed), so `watchViews` builds
  the fixture's views in the booted process.
- It fails on a tree with trails#9382 reverted, and passes on `main`.
- The watcher it starts is closed in teardown.
