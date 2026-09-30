---
title: "Split AppBase / AppGenerator into Rails' Thor commands (create_root_files … finish_template)"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "generator-base-thor-initialize-arguments-and-options-parse",
    "converge-generator-base-file-actions-onto-thor-actions",
    "thor-command-registration-lint-rule",
    "port-app-builder-and-build-dispatch",
    "port-thor-actions-apply",
  ]
deps-rfc: []
est-loc: 650
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Each generator below still has one hand-written `run(...)` that performs every Rails step in
line and is registered as the single Thor command by
`generator-base-thor-initialize-arguments-and-options-parse`. Rails splits the same work into
one public method per step, and `Thor::Group#invoke_all` runs them in declaration order,
interleaved with the `_invoke_from_option_*` commands that `hook_for` declares:

- `vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb` → `packages/trailties/src/generators/app-base.ts`
- `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb` → `packages/trailties/src/generators/app-generator.ts`

`AppGenerator` (1412 lines in trails) is the largest generator. Rails declares about 30 public
steps (`create_root_files`, `create_app_files`, … `run_bundle`, `run_after_bundle_callbacks`,
`finish_template`; `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/app_generator.rb:352-560`) plus `AppBase`'s `class_option`s
(`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:40-120`). The builder methods themselves move to `AppBuilder` in
`port-app-builder-and-build-dispatch` (0142), which this story depends on. This story only
splits `run()` into the step methods that call `build(...)`, and wires
`apply_rails_template` through Thor's `apply`.

## Fidelity traps (predicted at authoring)

- [ ] **One Rails method is one command.** Each public method of the Rails generator becomes a
      public TS method, registered with `this.methodAdded(...)` in Rails' declaration order. Each
      `hook_for` / `class_option` / `argument` goes in the same static block at its Rails position,
      and `thor-command-registration-lint-rule` must pass without an exemption.
- [ ] **No `run(name, attributes)`.** Steps read `this.name`, `this.attributes` and
      `this.options.*` (Thor `argument` accessors and parsed options), and take no parameters.
- [ ] **Steps are async** and await every Thor action. `invoke_all` awaits them in order.
- [ ] **`options.foo?`** is `this.options.isFoo` (Ruby truthiness; decision 6), never a bare
      `if (this.options.foo)`.
- [ ] **Tests** drive the generator through `run_generator` → `Klass.start(args, {{ destinationRoot }})`
      (`Rails::Generators::Testing::Behavior`), not through `new Klass(...).run(...)`.

## Acceptance criteria

- [ ] Each generator's public methods and their order match the Rails file, and
      `parity:api` scores them.
- [ ] Each generator's railties test file (`vendor/rails/v8.0.2/railties/test/generators/<name>_generator_test.rb`)
      keeps its matched count. Cases that were `it.skip`ped only because steps ran out of order
      or `run` took parameters are un-skipped.
