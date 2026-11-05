---
title: "generator-base-name-reads-ruby-class-path"
status: claimed
updated: 2026-11-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-05T16:36:28Z"
assignee: "actionmailer-base-types-from-included-modules"
blocked-by: null
closed-reason: null
---

## Context

`GeneratorBase.baseName` / `generatorName` (`packages/trailties/src/generators/base.ts:302-315`) split the JS
class name, so `Rails::Generators::TaskGenerator` answers base `task_generator` where Rails'
`name.split("::").first.underscore` answers `rails`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb`, `self.base_name` / `self.generator_name`).
`default_source_root` (`base.ts:137-142`) therefore never finds a generator's `templates/` directory, and
`TaskGenerator` sets `sourceRoot` explicitly as a stopgap (converge-generators-onto-thor-template).

`GeneratorBase` also lacks Rails' `self.namespace` override (`base.rb:54-57`:
`super.delete_suffix("_generator").sub(/:generators:/, ":")`).

A trailties generator class-path table was tried: `scripts/api-compare/class-paths.ts` only walks the `.`
export, and a table walking `./generators` imports every generator module eagerly. Loaded before the app's
generator config, it bakes wrong `class_option` defaults (63 red model-generator tests, `orm` default `false`);
imported from `base.ts` it closes a TDZ cycle; and generators load lazily per file, so nothing registers it in
production.

## Acceptance criteria

- [ ] `baseName` / `generatorName` read the Ruby path (`rbModName`) for every generator, in tests and under `trails generate`.
- [ ] `GeneratorBase.namespace` ports `base.rb:54-57`.
- [ ] `TaskGenerator`'s explicit `sourceRoot` is removed; `default_source_root` finds `rails/task/templates`.
- [ ] `AppGenerator`'s explicit `sourceRoot` (trails#9462) is removed; `default_source_root` finds `rails/app/templates`.
- [ ] (from the closed duplicate `generator-base-name-derived-from-bare-js-class-name`) The consumers read the Ruby-path names: `hookFor`'s `in_base` / `as_hook` defaults (`base.rb:175-177`) and `defaultForOption`'s `config[generator_name]` / `config[base_name]` lookups (`base.rb:355-365`). A test covers each.
