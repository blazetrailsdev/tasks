---
title: "trailties-test-console-irb-and-dbconsole-remainder"
status: done
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10687
claim: "2026-11-24T00:39:46Z"
assignee: "trailties-test-console-irb-and-dbconsole-remainder"
blocked-by: null
closed-reason: null
---

## Context

Split from `trailties-test-console-and-dbconsole`; that PR hit the LOC ceiling
porting its bundle's middleware and generator tests. Still Miss in
`pnpm parity:test -- --package trailties`:

- `vendor/rails/v8.0.2/railties/test/application/console_test.rb`: 18 tests
  (`test_sandbox` :50 through `test_console_doesnt_disable_IRB_auto_completion_in_local` :268).
  Four (`helper/controller/new_session/app helper method`) are already ported in
  `packages/trailties/test/application/console.test.ts`, whose fake-app
  REPL-adapter harness (`registerReplAdapter`, `writePrompt`, `assertOutput`)
  is where the rest go.
- `vendor/rails/v8.0.2/railties/test/application/dbconsole_test.rb`: 2 tests
  (`:21`, `:44`), into `packages/trailties/test/application/dbconsole.test.ts`.

Known lib gaps found while sizing:

- `TSREPLConsole#colorizedEnv` (`packages/trailties/lib/commands/console/tsrepl-console.ts`)
  always emits ANSI escapes; Rails' `IRB::Color.colorize`
  (`railties/lib/rails/commands/console/irb_console.rb:120-130`) honours
  `colorable?`, so the prompt tests (`app-template(test)>`) need that arm.
- `TSREPL.setup` reads no rc file (`IRBRC`, `console_respects_user_defined_prompt_mode`)
  and formats the prompt once in `evalInput`, so a live `conf.irb_name` change
  (`test_prompt_allows_changing_irb_name`) is not seen.
- Sandbox tests need a real AR connection and `Post` table in the built app.

## Acceptance criteria

- [ ] Every listed Rails test is matched, with no Miss left for both files.
- [ ] No new `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
- [ ] Lib fixes land in the same PR.
