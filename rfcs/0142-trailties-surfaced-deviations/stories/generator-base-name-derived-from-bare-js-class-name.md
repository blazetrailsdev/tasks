---
title: "GeneratorBase.baseName reads a bare JS class name, not Rails::Generators::<X>"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Base.base_name` / `generator_name`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:334-346`) come from the Ruby
constant path. `Rails::Generators::ModelGenerator` has `base_name` `"rails"` and
`generator_name` `"model"`, and `namespace` (`base.rb:54-57`, via Thor's
`namespace_from_thor_class`) is `"rails:model"`. Three things read them:

- `hook_for`'s `in_base` / `as_hook` defaults (`base.rb:175-177`)
- `default_for_option`'s `config[generator_name]` / `config[base_name]` lookups
  (`base.rb:355-365`)
- `default_source_root` (`base.rb`)

trails' `GeneratorBase.baseName()` / `generatorName()`
(`packages/trailties/src/generators/base.ts`) split `this.name` on `"::"`, but a JS class
name is a bare `ModelGenerator`. So `baseName()` answers `"model_generator"`, not
`"rails"`. `hookFor` then defaults `in` to the wrong namespace, and `defaultForOption`
never reads `Generators.options()["rails"]` through the `base_name` arm. The trails
`namespace` is instead stamped onto the class by `requireGenerator` in `generators.ts`,
and only after a lookup has loaded the file.

## Acceptance criteria

- Each ported generator answers Rails' constant path from `name`, e.g. with
  `Object.defineProperty(klass, "name", { value: "Rails::Generators::ModelGenerator" })` as the
  trailties railties already do, or an equivalent. `baseName()` / `generatorName()` then
  return `"rails"` / `"model"` as in Rails.
- `namespace` derives from that constant path as `base.rb:54-57` does, rather than only from
  `requireGenerator`'s path.
- A test asserts `ModelGenerator.baseName() === "rails"` and that `hookFor` without `in:`
  records `["rails", "model"]`.
