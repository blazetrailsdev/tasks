---
title: "generators-run-hooks-after-run-not-in-declaration-order"
status: draft
updated: 2026-09-28
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

Rails generators are `Thor::Group`s, and `Thor::Group#invoke_all` runs every public
method as a command, in the order it was declared. `hook_for`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:174-202`) calls Thor's
`invoke_from_option`, which `class_eval`s a `_invoke_from_option_<name>` command at the
point of declaration, so hooks interleave with the generator's own steps. For example,
`ResourceGenerator` (`generators/rails/resource/resource_generator.rb:11-18`) runs
`resource_controller`, then declares `:actions`, then runs `resource_route`, and
`ControllerGenerator` (`controller_generator.rb:13-26`) runs `create_controller_files`
and `add_routes` before its `template_engine` / `test_framework` / `helper` hooks.

trails generators have a single `run` method instead of one command per public method.
trails#8228 ported `hookFor`, and its private `GeneratorBase.dispatch`
(`packages/trailties/src/generators/base.ts`) runs `run` first and then every
`_invokeFromOption<Name>` in registration order. That is correct only when every
`hook_for` comes after all of a generator's own steps.

## Acceptance criteria

- `GeneratorBase` records its commands (public instance steps and the
  `_invokeFromOption<Name>` methods) in declaration order, and `dispatch` runs them in
  that order, as `Thor::Group#invoke_all` does.
- A test mirrors `ResourceGenerator`'s order: a hook declared between two steps runs
  between them.
