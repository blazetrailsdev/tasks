---
title: "Split the controller / helper / resource / scaffold generator family into Rails' Thor commands, so hooks run in declaration order"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps:
  [
    "generator-base-thor-initialize-arguments-and-options-parse",
    "converge-generator-base-file-actions-onto-thor-actions",
    "thor-command-registration-lint-rule",
    "converge-named-base-onto-thor-argument-and-template-override",
  ]
deps-rfc: []
est-loc: 650
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails generators are `Thor::Group`s, and `Thor::Group#invoke_all` runs every public method as a
command, in the order it was declared (`vendor/thor/v1.3.2/lib/thor/group.rb:263-266`, `vendor/thor/v1.3.2/lib/thor/invocation.rb:133-135`).
`hook_for` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:174-202`) calls Thor's
`invoke_from_option`, which defines a `_invoke_from_option_<name>` command at the point of
declaration (`vendor/thor/v1.3.2/lib/thor/group.rb:110-141`), so hooks interleave with the generator's own steps. For
example, `ResourceGenerator` (`generators/rails/resource/resource_generator.rb:11-18`) runs
`resource_controller`, then declares `:actions`, then runs `resource_route`, and
`ControllerGenerator` (`controller_generator.rb:13-26`) runs `create_controller_files` and
`add_routes` before its `template_engine` / `test_framework` / `helper` hooks.

trails generators have a single `run` method. After `rebase-generator-base-onto-thor-group`,
that `run` is registered as the one command, so every hook runs after all of the generator's
own steps. RFC decision 1 (explicit `methodAdded`) is what restores the interleaving: each
Rails step becomes its own command, registered in the static block in Rails' order, with each
`hookFor` at its Rails position.

Generators in this family:

- `rails/controller/controller_generator.rb` → `packages/trailties/src/generators/rails/controller/controller-generator.ts`
- `rails/helper/helper_generator.rb` → `packages/trailties/src/generators/rails/helper/helper-generator.ts`
- `rails/resource/resource_generator.rb` → `packages/trailties/src/generators/rails/resource/resource-generator.ts`
- `rails/resource_route/resource_route_generator.rb` → `packages/trailties/src/generators/rails/resource-route/resource-route-generator.ts`
- `rails/scaffold/scaffold_generator.rb` → `packages/trailties/src/generators/rails/scaffold/scaffold-generator.ts`
- `rails/scaffold_controller/scaffold_controller_generator.rb` → `packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`
- `erb/scaffold/scaffold_generator.rb` → `packages/trailties/src/generators/tse/scaffold/scaffold-generator.ts`
- `test_unit/scaffold/scaffold_generator.rb` → `packages/trailties/src/generators/test-unit/scaffold/scaffold-generator.ts`

## Acceptance criteria

- [ ] Each generator's public methods, and the `hookFor` calls between them, follow the Rails
      file's declaration order, and `thor-command-registration-lint-rule` passes.
- [ ] A test mirrors `ResourceGenerator`'s order: a hook declared between two steps runs
      between them.
- [ ] The railties test files for these generators keep or grow their matched counts.
