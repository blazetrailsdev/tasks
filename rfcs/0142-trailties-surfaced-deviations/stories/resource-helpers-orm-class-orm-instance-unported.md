---
title: "resource-helpers-orm-class-orm-instance-unported"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
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

Surfaced in the review of trails#8150, which rewrote `packages/trailties/src/generators/resource-helpers.ts` as a `ResourceHelpers` module included with `include()`.

Before that PR, the file carried `defaultOrmInstance(name)`, which returned `new ActiveModel(name)`. That was an invented stand-in with no Rails name and no caller outside its own test. #8150 removed it, and `resource_helpers.rb`'s two ORM helpers are now unported:

- `orm_class` (`railties/lib/rails/generators/resource_helpers.rb:61-75`) raises `"You need to have :orm as class option to invoke orm_class and orm_instance"` unless the class declares an `:orm` option. It then constantizes `"#{options[:orm].to_s.camelize}::Generators::ActiveModel"`, rescuing `NameError` to fall back to `Rails::Generators::ActiveModel`.
- `orm_instance(name = singular_table_name)` (`:78-80`) memoizes `orm_class.new(name)`.

`ScaffoldControllerGenerator` declares `class_option :orm, required: true` (`scaffold_controller_generator.rb:13-14`), and its controller templates read `orm_instance` / `orm_class` (for example `orm_class.all(class_name)`). Trails' scaffold controller emits hand-written method bodies instead.

`packages/trailties/src/generators/active-model.ts` (`Rails::Generators::ActiveModel`) is now referenced only by `generators/index.ts`.

## Acceptance criteria

- `ResourceHelpers` gains `ormClass` / `ormInstance` with Rails' raise, the `constantize` + `NameError` fallback, and memoization.
- `ScaffoldControllerGenerator` declares the `orm` class option.
- The scaffold controller's emitted bodies read `ormClass` / `ormInstance`, as Rails' `controller.rb.tt` does, instead of hand-built `${model}.all()` strings.
