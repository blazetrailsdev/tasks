---
title: "ControllerGenerator routes use a dasherized segment where Rails uses file_name"
status: claimed
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-09-27T22:39:57Z"
assignee: "map-rubocop-to-eslint-in-token-renames"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ControllerGenerator#add_routes`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/controller/controller_generator.rb:17-22`)
emits `get "#{file_name}/#{action}"`. `file_name` is the underscored singular name
(`Rails::Generators::NamedBase#file_name`, `named_base.rb`), so
`bin/rails g controller AdminUsers index` draws `get "admin_users/index"`. The
path-only form then resolves to `admin_users#index`.

trails' `ControllerGenerator#addRoutes`
(`packages/trailties/src/generators/rails/controller/controller-generator.ts`) builds
its segment as `dasherize(underscore(namespaceParts.at(-1)))`. After trails#8176 it
emits the Rails path-only form, `router.get("${controllerSegment}/${a}")`. So a
multi-word controller draws `router.get("admin-users/index")`, which resolves to
controller `admin-users`. That controller does not exist, where Rails would reach
`admin_users`. Before #8176 the same segment went into `to: "admin-users#index"`,
so this is an old divergence. The `dasherize` has no Rails counterpart.

## Acceptance criteria

- The routing segment is the port of `file_name` (underscored, no `dasherize`), so
  `AdminUsers` draws `router.get("admin_users/index")`.
- A controller-generator test covers a multi-word name, e.g. "add routes" with
  `AdminUsers`. It fails on the current dasherized segment.
- The view/test file paths that share `controllerSegment` keep their own Rails
  spellings. Check `controller_generator.rb` and its template hooks for each one.
