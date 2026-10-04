---
title: "Commands and generator namespaces register and list in kebab-case, and accept snake_case input"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0171 decision 6, under "Command and generator names are kebab-case on the command line",
makes kebab-case the spelling commands and generator namespaces are registered and listed under,
and keeps snake_case accepted on input.

Today's port does not do this:

- `Thor.createCommand` (`packages/trailties/src/thor/thor.ts:352`) keys `commands()` by the TS
  method name, so a command method `fooBar` registers as the command `fooBar`. Thor registers
  `def foo_bar` as `foo_bar` (`vendor/thor/v1.3.2/lib/thor.rb:560-583`).
- `normalizeCommandName` is declared on the `ThorClass` type (`thor.ts:41`) but is not ported.
  Thor's body (`vendor/thor/v1.3.2/lib/thor.rb:605-620`) folds `foo-bar` into `foo_bar`. Here it
  folds `_` into `-`.
- `namespaceFromThorClass` (`packages/trailties/src/thor/util.ts:28`) runs `snakeCase`, as
  `util.rb:43-47` does, so a generator namespace comes out as `rails:scaffold_controller`.
  `packages/trailties/src/generators.ts:71` also maps `scaffoldController` to
  `"scaffold_controller"`.
- Rails' namespace lookups, `Rails::Command.find_by_namespace`
  (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:90-99`) and
  `Rails::Generators.find_by_namespace` (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb:234-256`),
  match the namespace exactly, with no fold.

No Rails command registers through `methodAdded` yet (the `port-*-command-onto-rails-command-base`
stories have not landed), so this should land before those stories, or they will bake in
whichever spelling the port has at that point.

## Acceptance criteria

- [ ] A command method registers and lists under its kebab-case name: a `fooBar` command is
      `foo-bar` in `commands()`, `help` and usage banners. Convert at one site.
- [ ] Generator namespaces are kebab-case (`rails:scaffold-controller`) wherever they are listed
      or suggested: `rails generate` help, `sorted_groups`, and `CorrectableNameError` suggestions.
      `Thor::Util.snakeCase` stays a faithful port; the kebab conversion is a separate step at
      the one conversion site.
- [ ] `normalizeCommandName` is ported with the fold reversed (`_` to `-`). `rails foo_bar` and
      `rails foo-bar` both dispatch to the `foo-bar` command.
- [ ] Command and generator namespace lookup accepts snake_case: `rails g scaffold_controller`
      and `rails g scaffold-controller` both resolve to the scaffold controller generator.
- [ ] Each deviation from the Ruby body (the reversed fold, the generator lookup fold, the kebab
      conversion) carries an `@inventedArm` receipt that points at RFC 0171 decision 6.
- [ ] Ported Thor and Rails tests that assert snake_case help or usage text assert the kebab
      spelling, each with a receipt row in `scripts/test-compare/assertion-receipts.ts` citing
      the decision. Test names are not changed.
- [ ] Trails tests cover both input spellings, for one command and one generator.
- [ ] The fold applies only to Thor command and namespace lookup. `Rails::Command.invoke`
      (`command.rb:56-69`) still hands `full_namespace` to `invoke_rake` as typed, so an
      underscored Rake task name (`active_storage:install`) is never rewritten.
