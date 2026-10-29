---
title: "Command::Actions#load_generators sets Generators.namespace for an engine"
status: blocked
updated: 2026-10-29
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-29T22:07:16Z"
assignee: "converge-named-base-onto-thor-argument-and-template-override"
blocked-by: "Needs Railtie#railtie_namespace (railties/lib/rails/railtie.rb:266-268), which walks module_parents via constantize — barred by CLAUDE.md 'Constant lookup is an import or a registry'; owner decision needed on how an engine instance finds its isolated namespace module. ENGINE_ROOT (engine/commands.rb) is also unported."
closed-reason: null
---

## Context

trails#9410 ported `Rails::Generators.namespace` (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb:27`, `mattr_accessor :namespace`) as `Generators.namespace` in `packages/trailties/src/generators.ts`. It also ported the readers: `Base#namespace` / `#namespaced?` / `#namespace_dirs` (`generators/base.rb:312-322`) and `NamedBase#class_path` / `#namespaced_class_path` (`generators/named_base.rb:58-68`).

Nothing writes the accessor yet. In Rails, `Rails::Command::Actions#load_generators` sets it under `ENGINE_PATH` (`vendor/rails/v8.0.2/railties/lib/rails/command/actions.rb:36-40`):

```ruby
def load_generators
  engine = ::Rails::Engine.find(ENGINE_ROOT)
  Rails::Generators.namespace = engine.railtie_namespace
  engine.load_generators
end
```

trails' `packages/trailties/src/command/actions.ts:22` ports only the application arm (`Trails.application!.loadGenerators()`). So the namespaced `class_path` arm is never reached, and an isolated engine's generators write un-namespaced paths.

## Acceptance criteria

- `actions.ts` ports the `defined?(ENGINE_PATH)` split of `load_tasks` / `load_generators`. The engine arm finds the engine by `ENGINE_ROOT`, sets `Generators.namespace = engine.railtieNamespace`, and calls `engine.loadGenerators()`.
- A test generates a model inside an isolated engine and asserts the namespaced `file_path` / `class_name` / `table_name`, following the Rails engine generator tests (`vendor/rails/v8.0.2/railties/test/generators/namespaced_generators_test.rb`).
