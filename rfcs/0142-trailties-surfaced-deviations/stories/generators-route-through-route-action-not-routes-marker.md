---
title: "generators-route-through-route-action-not-routes-marker"
status: in-progress
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: trails#8218
claim: "2026-09-28T14:20:29Z"
assignee: "generators-route-through-route-action-not-routes-marker"
blocked-by: null
closed-reason: null
---

## Context

`trails-actions-insert-at-marker-instead-of-rails-sentinel` converged
`TrailsActions#route` (`packages/trailties/src/generators/trails-actions.ts`)
onto Rails' routes-draw sentinel (`railties/lib/rails/generators/actions.rb:409-437`,
`route_namespace_pattern` at `:521-529`), with `namespace:` support. The
generated `config/routes.ts` still carries a `// routes` marker, because five
generators bypass `route` and insert before that marker through the invented
`GeneratorBase#insertIntoFile(path, marker, content)`
(`packages/trailties/src/generators/base.ts`):

- `rails/controller/controller-generator.ts` — Rails
  `controller_generator.rb` calls `route generate_routing_code, namespace: regular_class_path`.
- `rails/resource-route/resource-route-generator.ts` — Rails
  `resource_route_generator.rb` calls `route "resources :#{file_name.pluralize}", namespace: regular_class_path`.
- `rails/scaffold/scaffold-generator.ts` and
  `rails/scaffold_controller/scaffold-controller-generator.ts` — Rails reaches
  routes only through the `resource_route` hook.
- `rails/authentication/authentication-generator.ts` — Rails
  `authentication_generator.rb` calls `route "resources :passwords, param: :token"` / `route "resource :session"`.

These inserts also write `router.` into a function whose parameter is `mapper`.

## Acceptance criteria

- Each generator above calls `this.route(code, { namespace })` as its Rails
  counterpart does, with `mapper.` routing code.
- The `// routes` marker is removed from the generated `config/routes.ts`
  (`app-generator.ts`), and `GeneratorBase#insertIntoFile` is deleted if it has
  no remaining caller.
- `route`'s `behavior == :revoke` arm (`actions.rb:428-435`) is ported.
