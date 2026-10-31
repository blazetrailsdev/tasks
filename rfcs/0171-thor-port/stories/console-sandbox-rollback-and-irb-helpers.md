---
title: "console-sandbox-rollback-and-irb-helpers"
status: draft
updated: 2026-10-31
rfc: "0171-thor-port"
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

`port-console-command-onto-rails-command-base` landed `Rails::Console`, `ConsoleCommand` and `IRBConsole#start` / `#colorized_env` (`packages/trailties/src/commands/console.ts`, `commands/console/irb-console.ts`). Three Rails behaviours remain unported:

- `--sandbox` sets `app.sandbox` but nothing rolls back: `active_record/railtie.rb:64` requires `active_record/railties/console_sandbox` when `app.sandbox?`. trails' activerecord railtie has no such console block, while the console prints "Any modifications you make will be rolled back on exit".
- The console helpers in `vendor/rails/v8.0.2/railties/lib/rails/commands/console/irb_console.rb:9-66`: `helper`, `controller`, `new_session`, `app`, `reload!`.
- The remaining `bin/rails` aliases in `railties/lib/rails/commands.rb:5-13`. `packages/trailties/src/bin.ts` holds only `c`; `db` => `dbconsole` conflicts with trails' `trails db migrate` commander group.

## Acceptance criteria

- [ ] `trails console --sandbox` rolls back modifications on exit, ported from `console_sandbox.rb`, with a test.
- [ ] `helper`, `controller`, `newSession`, `app` and `reload` are available at the prompt.
- [ ] `bin.ts` carries the Rails alias table once `db` is no longer a commander group.
