---
title: "trailties-routes-expanded-source-location"
status: ready
updated: 2026-11-22
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

`vendor/rails/v8.0.2/railties/test/commands/routes_test.rb:225-390`
("rails routes with expanded option") stubs `IO.console_size` to `[0, 27]`
and asserts each route's `Source Location` row. In a trails app
`bin/trails routes --expanded`:

- renders the separator at the full terminal width, not the stubbed 27
  columns (no `IO.console_size` seam the test can stub across `bin/trails`);
- reports `Source Location | file:///…/packages/actionpack/dist/action-dispatch/routing/mapper.js:371`
  for an app route, where Rails reports `#{app_path}/config/routes.rb:XX`.
  `Mapping#route_source_location`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:378-389`)
  skips frames under `action_dispatch`; trails' check misses the `dist/` frame.

## Acceptance criteria

- `routeSourceLocation` skips actionpack's own frames from `dist/` and returns
  the app's `config/routes.ts:<line>` as a filesystem path.
- The test is ported in `packages/trailties/test/commands/routes.test.ts`
  (Propshaft's `/assets` route dropped per CLAUDE.md "importmap-rails and
  propshaft are out of scope") and passes.
