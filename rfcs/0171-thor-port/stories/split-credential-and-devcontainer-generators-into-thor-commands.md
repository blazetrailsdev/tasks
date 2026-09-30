---
title: "Split the credentials / encrypted-file / key / devcontainer / db:system:change generators into Rails' Thor commands"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "generator-base-thor-initialize-arguments-and-options-parse",
    "converge-generator-base-file-actions-onto-thor-actions",
    "thor-command-registration-lint-rule",
  ]
deps-rfc: []
est-loc: 450
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

- `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/credentials/credentials_generator.rb` → `packages/trailties/src/generators/rails/credentials/credentials-generator.ts`
- `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/encrypted_file/encrypted_file_generator.rb` → `packages/trailties/src/generators/rails/encrypted-file/encrypted-file-generator.ts`
- `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/encryption_key_file/encryption_key_file_generator.rb` → `packages/trailties/src/generators/rails/encryption-key-file/encryption-key-file-generator.ts`
- `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/master_key/master_key_generator.rb` → `packages/trailties/src/generators/rails/master-key/master-key-generator.ts`
- `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb` → `packages/trailties/src/generators/rails/devcontainer/devcontainer-generator.ts`
- `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/db/system/change/change_generator.rb` → `packages/trailties/src/generators/rails/db/system/change/change-generator.ts`

`ChangeGenerator` hand-rolls a private `template` (`change-generator.ts:53`), which is deleted in favor of Thor's.

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
