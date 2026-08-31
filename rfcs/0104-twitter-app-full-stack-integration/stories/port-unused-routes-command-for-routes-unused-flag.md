---
title: "port-unused-routes-command-for-routes-unused-flag"
status: draft
updated: 2026-08-30
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 55
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::UnusedRoutesCommand`
(`railties/lib/rails/commands/unused_routes/unused_routes_command.rb`) is not
ported, so `trails routes` cannot offer Rails' `-u/--unused` class option
(`routes_command.rb:11`) or the `invoke_command` branch that delegates to it
(`routes_command.rb:14-20`). `packages/trailties/src/commands/routes.ts` records
both omissions and the reason.

Two blockers, both concrete:

- Every arm of `RouteInfo#unused?` (`unused_routes_command.rb:18,29-38`) hangs
  off `"#{controller}Controller".safe_constantize`. trails has no global
  controller constant table: `Request#controllerClassFor`
  (`packages/actionpack/src/action-dispatch/http/request.ts:1014-1030`) throws
  saying so, and `controllerDispatcher` resolves controllers from the table the
  router was handed (`routing/dispatcher.ts:140-160`).
- `perform` ends in `exit(1)` (`unused_routes_command.rb:49`), and no trailties
  command sets a process exit code today.

The pieces that DO exist: `ConsoleFormatter.Unused`
(`packages/actionpack/src/action-dispatch/routing/inspector.ts:390`) and the
`perform`/`inspector`/`formatter`/`routesFilter` shape already ported for
`routesCommand` in #7262.

## Acceptance criteria

- `UnusedRoutesCommand` ported: `RouteInfo` with `unused?` /
  `controller_class_missing?` / `action_missing?` / `template_missing?`,
  `perform`, `inspector`, `routes`, `formatter`, `routes_filter`.
- `routesCommand` regains `-u/--unused` and the `invoke_command` dispatch, and
  its JSDoc receipt for the omission is deleted.
- Depends on a controller-class resolution path for a route's `controller`
  string; if that is still missing, this story blocks on it rather than
  inventing one.
