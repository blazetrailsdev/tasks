---
title: "ControllerGenerator extends GeneratorBase where Rails' is a NamedBase; add_routes takes parameters"
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

Rails `Rails::Generators::ControllerGenerator < NamedBase`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/controller/controller_generator.rb:5`),
and its `add_routes` (`:18-23`) takes no arguments: it reads `options[:skip_routes]`,
`actions` (a Thor argument, `:6`), `file_name` (overridden at `:34-36` to strip the
`_controller` suffix) and `regular_class_path` (NamedBase) off `self`.

trails' `ControllerGenerator` (`packages/trailties/src/generators/rails/controller/controller-generator.ts`)
extends `GeneratorBase`, takes `run(name, actions, options)`, derives paths through
`controllerPathHelpers(name)`, and its private `addRoutes(namespaceParts, actions, skipRoutes)`
builds a local `regularClassPath` from `namespaceParts` because there is no NamedBase
`regularClassPath()` to call (trails#8218).

## Acceptance criteria

- `ControllerGenerator extends NamedBase`; `actions` and `skipRoutes` live on the instance
  (Thor argument / class option), and `fileName` strips the controller suffix as
  `remove_possible_suffix` does (`:38-40`).
- `addRoutes()` takes no parameters and calls
  `this.route(routingCode, { namespace: this.regularClassPath() })`.
- The `add_routes` call precedes the template-engine/test/helper hooks, as now.
