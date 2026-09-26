---
title: "mapping-make-route-source-location"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `Mapping#make_route` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:183-188`) passes `source_location: route_source_location` to `Journey::Route.new`. `route_source_location` (`mapper.rb:378-389`) returns the first caller frame outside `action_dispatch`, cleaned by `Mapper.backtrace_cleaner`, when `Mapper.route_source_locations` is enabled. Both class attributes are declared at `mapper.rb:19-21`.

trails#8160 ported `Mapping#makeRoute` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`). It passes no source location, for two reasons:

- The trails routing `Route` (`routing/route.ts`) has no `sourceLocation` field. `journey/route.ts:171-226` has one, but it is on the Journey route.
- `Mapper.routeSourceLocations`, `Mapper.backtraceCleaner` and `route_source_location` are not ported.

The routes inspector already reads `sourceLocation` (`routing/inspector.ts:137,334`), so `bin/rails routes --expanded` never shows a "Source Location" row.

## Acceptance criteria

- `Mapper.routeSourceLocations` and `Mapper.backtraceCleaner` are class attributes, as at `mapper.rb:19-21`.
- `Mapping#routeSourceLocation` mirrors `mapper.rb:378-389`. It walks the caller stack, skips frames inside action-dispatch, and cleans each frame with the backtrace cleaner.
- `makeRoute` passes `sourceLocation: this.routeSourceLocation()`, and the inspector's `Source Location` row renders.
