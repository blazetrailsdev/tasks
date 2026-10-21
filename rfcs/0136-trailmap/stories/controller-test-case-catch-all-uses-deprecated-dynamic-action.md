---
title: "The controller test case's catch-all route uses a deprecated dynamic :action segment"
status: draft
updated: 2026-10-21
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test/support/controller-test-case.ts` gives a controller with no app route a
private route set with one catch-all: a `get` of `__test/<controllerPath>/:action`.
trails now raises Rails 8.0's deprecation for a dynamic `:action` segment
("Using a dynamic :action segment in a route is deprecated and will be removed
in Rails 8.1", actionpack `mapper.ts` `addRoute`, Rails
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`). It
prints on every test-only controller (`scripts/app-helpers-probe.ts`'s
`HelperProbesController` shows it in trailmap#72's CI log), and the route
stops working once trails tracks 8.1.

## Acceptance criteria

- The test-only route set draws one explicit route per action the test calls
  (or `get "__test/<path>/<action>", action: "<action>"`), with no `:action`
  segment.
- No dynamic-`:action` deprecation is printed by `pnpm test` or by
  `scripts/app-helpers-probe.ts`.
