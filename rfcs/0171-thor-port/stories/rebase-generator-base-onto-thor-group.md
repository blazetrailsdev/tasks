---
title: "Rebase GeneratorBase onto Thor::Group + Thor::Shell and delete its dispatch / invoke / hook / say copies"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "port-thor-group",
    "port-thor-shell-module-basic-output-and-terminal",
    "thor-command-registration-lint-rule",
    "generator-base-name-derived-from-bare-js-class-name",
  ]
deps-rfc: []
est-loc: 600
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Base < Thor::Group` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:17`).
trailties' `GeneratorBase` (`packages/trailties/src/generators/base.ts`, 991 lines) is a standalone class that re-implements
the Group half of Thor:

- `start` / `dispatch` (`:343-465`; its parser moves in
  `generator-base-thor-initialize-arguments-and-options-parse`), `commands` / `allCommands`
  (`:467-486`), `invocations` / `invocationBlocks` / `invokeFromOption` / `removeInvocation`
  (`:488-551`), `prepareForInvocation` (`:810-830`);
- `invoke` / `invokeCommand` / `invokeAll` / `_retrieveClassAndCommand` /
  `_parseInitializationOptions` / `_sharedConfiguration` / `_invokeForClassMethod` (`:553-688`);
- `classOption` / `classOptions` / `removeClassOption` / `classOptionsHelp` (`:296-341`);
- `say` / `sayStatus` / `isQuiet` (`:212-235`), all `@noRailsEquivalent PERMANENT`, and the
  per-instance `output` callback they write through.

`hookFor` / `removeHookFor` / `classOption` (Rails' override, `base.rb:174-236`) stay, and call
`super`'s Thor implementations.

The generator base classes move with it: `NamedBase` (`packages/trailties/src/generators/named-base.ts`), `AppBase`
(`packages/trailties/src/generators/app-base.ts`) and `Tse::Generators::Base` (`packages/trailties/src/generators/tse.ts`, the port of
`vendor/rails/v8.0.2/railties/lib/rails/generators/erb.rb`).

## Acceptance criteria

- [ ] `class GeneratorBase extends Thor.Group` with `include(Thor.Actions)`, and the members
      listed above are deleted. Rails' overrides (`class_option`, `hook_for`, `remove_hook_for`,
      `prepare_for_invocation`, `banner`, `base_name`, …) remain at Rails' names over `super`.
- [ ] Until each generator is split (the `split-*` stories), its `run` is its only command:
      `static { this.methodAdded("run") }`.
- [ ] `Generators.invoke` (`packages/trailties/src/generators.ts`) calls `klass.start(args,
config)` as `vendor/rails/v8.0.2/railties/lib/rails/generators.rb` does.
      `Rails::Generators::Testing::Behavior#run_generator` (`packages/trailties/src/generators/testing/behavior.ts`) captures
      stdout around `generator_class.start(args, config)`.
- [ ] Output goes through the Thor shell. The `output: (msg) => void` constructor option is
      removed, and tests capture stdout as the Rails tests do.
- [ ] `parity:api:extra --package trailties` drops by the deleted members, and their receipts go
      with them.
