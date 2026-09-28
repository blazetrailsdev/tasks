---
title: "bin/trails test: port Rails::Command::TestCommand and TestUnit::Runner"
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

Split from `generated-app-pnpm-test-finds-no-tests`, whose PR fixed the generated app's
`pnpm test` wiring (the `test:` block in the generated `vite.config.ts`,
`packages/trailties/src/generators/app-generator.ts`, mirroring
`default_test_glob` / `default_test_exclude_glob` at
`vendor/rails/v8.0.2/railties/lib/rails/test_unit/runner.rb:113-119`).

`bin/trails test` still fails with "unknown command 'test'": `packages/trailties/src/cli.ts`
registers no test command. Rails' is `Rails::Command::TestCommand`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/test/test_command.rb`): `perform(*args)`
parses options through `Rails::TestUnit::Runner.parse_options`, runs `test:prepare` unless an
exact-test argument is given (`EXACT_TEST_ARGUMENT_PATTERN`), then `Runner.run(args)`. It also
defines one subcommand per `Runner::TEST_FOLDERS` entry (`runner.rb:26`) plus `all`,
`functionals`, `units`, `system` and `generators`.

`Rails::TestUnit::Runner` (`runner.rb`, 214 lines) is not ported
(`packages/trailties/src/test-unit/` holds only the railtie). In trails the runner's
`run` hands the resolved file list to vitest instead of Minitest.

## Acceptance criteria

- `packages/trailties/src/commands/test.ts` ports `TestCommand#perform` and its folder
  subcommands, registered in `cli.ts`, so `bin/trails test`, `bin/trails test test/models`
  and `bin/trails test:models` run the generated app's tests and exit 0 after a scaffold.
- The runner's `default_test_glob` / `default_test_exclude_glob` / `list_tests` land in
  `packages/trailties/src/test-unit/runner.ts` under Rails' names.
