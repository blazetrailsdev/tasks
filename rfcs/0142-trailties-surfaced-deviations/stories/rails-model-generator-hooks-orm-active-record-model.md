---
title: "rails-model-generator-hooks-orm-active-record-model"
status: done
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8270
claim: "2026-09-30T12:30:12Z"
assignee: "rails-model-generator-hooks-orm-active-record-model"
blocked-by: null
closed-reason: null
---

## Context

trails#8245 put `ScaffoldGenerator` on `ResourceGenerator < ModelGenerator` and hooked `scaffold_controller` / `resource_route`. The model step is still unconverged. Rails' `Rails::Generators::ModelGenerator` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/model/model_generator.rb:10-11`) has no body and emits nothing itself: `hook_for :orm, required: true` invokes `active_record:model` (`vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/model/model_generator.rb`).

- That generator runs `check_class_collision` and declares the class options `migration`, `timestamps`, `parent`, `indexes`, `primary_key_type` and `database`.
- Its commands are `create_migration_file`, `create_model_file` and `create_module_file`, followed by `hook_for :test_framework`.
- The orm value comes from the AR railtie's `config.app_generators.orm :active_record, migration: true, timestamps: true` (`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:20`).

trails has instead:

- `packages/trailties/src/generators/rails/model/model-generator.ts` (`rails:model`) writes a bare `extends Base` model inline and has no `hookFor("orm")`.
- `packages/trailties/src/generators/model-generator.ts` is a `GeneratorBase` with `run(name, args, options)`. It holds the `active_record:model` body (migration, model, module file, model test) and is constructed directly by `commands/generate.ts`'s `model` subcommand and by `ScaffoldGenerator#run`.
- `ScaffoldGenerator#run` (`rails/scaffold/scaffold-generator.ts`) overrides the inherited model step and carries a `@noRailsEquivalent CONVERGEABLE` receipt pointing here.

## Acceptance criteria

- `rails:model` declares `hook_for :orm, required: true, desc: "ORM to be invoked"` and writes no file itself.
- The column-building model generator is a `NamedBase` at the `active_record:model` namespace (`generators/active-record/model/model-generator.ts`), with Rails' class options and its `create_migration_file` / `create_model_file` / `create_module_file` commands.
- The AR trailtie seeds `appGenerators.orm("active_record", { migration: true, timestamps: true })`.
- `ScaffoldGenerator` has no `run` override, and its receipt is gone; scaffold's model, migration and model test come through the inherited orm hook.
- `trails generate model` dispatches through `Generators.invoke("model", ...)`.
