---
title: "ControllerGenerator extends GeneratorBase where Rails' is a NamedBase; add_routes takes parameters"
status: blocked
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps:
  [
    port-generators-hook-for-and-app-generators-options,
    generators-have-no-thor-source-paths-or-template-files,
  ]
deps-rfc: []
est-loc: 120
priority: 6
pr: null
claim: "2026-09-30T13:06:35Z"
assignee: "anonymous-migration-class-name-is-empty-string-not-nil"
blocked-by: "needs Thor::Actions#template (thor-actions-template-is-unported) and the hook targets Tse/TestUnit ControllerGenerator + hookable HelperGenerator (controller-generator-hook-targets-are-unported); #8226 review rejected a NamedBase conversion without them"
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

### Findings from a first attempt (trails#8226, withdrawn)

Review held that converting to `NamedBase` is not enough on its own:

- `create_controller_files` is `template "controller.rb", ...` (`controller_generator.rb:13-15`).
  With no template/source-path machinery, a `@missingRailsCall template` receipt was rejected.
- The `hook_for :template_engine, :test_framework, :helper` block (`:24-26`) must invoke the
  hooked generators rather than write views, tests and the helper in line.

Hence the deps on `hook_for` and on template files.

## Acceptance criteria

- `ControllerGenerator extends NamedBase`; `actions` and `skipRoutes` live on the instance
  (Thor argument / class option), and `fileName` strips the controller suffix as
  `remove_possible_suffix` does (`:38-40`).
- `addRoutes()` takes no parameters and calls
  `this.route(routingCode, { namespace: this.regularClassPath() })`.
- The `add_routes` call precedes the template-engine/test/helper hooks, as now.
