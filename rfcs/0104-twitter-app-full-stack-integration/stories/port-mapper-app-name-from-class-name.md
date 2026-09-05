---
title: "port-mapper-app-name-from-class-name"
status: draft
updated: 2026-09-05
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

Rails' `mount` derives a mounted app's route name from the app's class name:
`Mapper#mount` calls `define_generate_prefix` / `app_name`
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:817-836`), and
`app_name` is `class_name.underscore.tr("/", "_")` for a non-Rails app, so
`mount MountedRackApp => "/foo"` is named `mounted_rack_app`.

trails' `Mapper#appName`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts:750`) does not read
the app's class name, so the same `mount` falls back to a path-derived name
(`foo`).

Surfaced in PR #7520: with `RouteWrapper#endpoint` converged, Rails'
`test_rails_routes_shows_named_route_with_mounted_rack_app`
(`vendor/rails/actionpack/test/dispatch/routing/inspector_test.rb:226`) prints
the right endpoint (`MountedRackApp`) but the wrong Prefix column, so it stays
`it.skip` in
`packages/actionpack/src/action-dispatch/dispatch/routing/inspector.test.ts`
while its explicit-`as:` sibling
(`test_rails_routes_shows_overridden_named_route_with_mounted_rack_app_with_name`,
`inspector_test.rb:237`) is enrolled and passing.

## Acceptance criteria

- [ ] `Mapper#appName` derives the name from the mounted app's class name the
      way `mapper.rb:825-836` does.
- [ ] `it.skip("rails routes shows named route with mounted rack app")` in
      `inspector.test.ts` is enrolled and passes with Rails' expected output
      (Prefix `mounted_rack_app`).
