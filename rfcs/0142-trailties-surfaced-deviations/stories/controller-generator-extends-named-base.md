---
title: "controller-generator-extends-named-base"
status: closed
updated: 2026-10-23
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
closed-reason: "Duplicate of controller-generator-is-not-a-named-base: same convergence (ControllerGenerator < NamedBase, controller_generator.rb:5-38); trails#8947's private NamedBase mirrors and the controllerPathHelpers '::' gap are merged into the survivor."
---

## Context

`Rails::Generators::ControllerGenerator < NamedBase`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/controller/controller_generator.rb:5-38`)
gets `name` and `actions` as Thor arguments. `NamedBase#initialize` calls `assign_names!`
(`railties/lib/rails/generators/named_base.rb:11-18,175-179`), and the controller overrides
`file_name` as `@_file_name ||= remove_possible_suffix(super)`.
trails' `packages/trailties/src/generators/rails/controller/controller-generator.ts` extends
`GeneratorBase` and takes `name`, `actions` and the options in `run()`. trails#8947 added
private `assignNamesBang` / `regularClassPath` / `fileName` / `removePossibleSuffix` mirrors,
plus `actions` / `classPath` / `_namedBaseFileName` fields. Paths still come from
`controllerPathHelpers`, which splits only `/`, where Rails also splits `::`.

## Acceptance criteria

- [ ] `ControllerGenerator extends NamedBase`, taking `name`, `actions` and the class options at construction.
- [ ] The private name mirrors and fields are deleted in favour of `NamedBase`'s `fileName` / `regularClassPath`, and the file destination uses the same class path (`File.join("app/controllers", class_path, ...)`).
- [ ] `Admin::UsersController` and `admin/users` produce the same files and route namespace.
