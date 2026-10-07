---
title: "UnusedRoutes template_missing? / action_missing? are Rails' && expressions, not guarded returns"
status: draft
updated: 2026-10-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::UnusedRoutesCommand::RouteInfo`'s two private predicates (`vendor/rails/v8.0.2/railties/lib/rails/commands/unused_routes/unused_routes_command.rb:33-39`) are one expression each:

```ruby
def template_missing?
  @controller_class && @controller_class.try(:view_paths).to_a.flat_map { |path| Dir["#{view_path(path)}.*"] }.none?
end

def action_missing?
  @controller_class && @controller_class.instance_methods.exclude?(@action_name.to_sym)
end
```

The port in `packages/trailties/src/commands/unused-routes.ts` (`templateMissing` at `:67-75`, `actionMissing` at `:78-81`) opens each with an invented guard, `if (this.controllerClass == null) return false;`, where Rails has the `&&`. After trails#8618 taught the arms fold to read the awaiting `none?` loop, `pnpm parity:api:arms:report` still shows `templateMissing` with one invented `if` against a Ruby body with no arm.

Two more differences in the same bodies:

- Rails returns `@controller_class` itself (nil) when it is unset, not `false`. Both callers use the value only in a boolean chain (`:21-23`), but the return type is the predicate's value (CLAUDE.md, "Predicates").
- `actionMissing` calls `controllerClass.actionMethods()` where Rails calls `instance_methods`; `templateMissing` reads `viewPaths?.() ?? []` where Rails has `.try(:view_paths).to_a`.

## Acceptance criteria

- [ ] `templateMissing` and `actionMissing` are each the `&&` expression Rails writes, with no leading `if`, returning the unset controller class's nil rather than `false`.
- [ ] `actionMissing` reads the method list Rails reads (`instance_methods`, through the ruby-compat analogue), or the difference carries a receipt naming the story that converges it.
- [ ] `pnpm parity:api:arms:report` shows no invented `if` for `templateMissing`, and `pnpm parity:api:calls` / `parity:api:calls:args` stay green.
