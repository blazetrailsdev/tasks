---
title: "find-by-namespace-lookup-loads-only-candidates"
status: draft
updated: 2026-09-29
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

`Rails::Command.find_by_namespace` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:90-98`)
builds the candidate namespaces, calls `lookup(lookups)` (`command.rb`, via
`Rails::Command::Behavior`) to `require` only the candidates'
`rails/commands/<ns>/<ns>_command` files, and then searches `subclasses` for
the first candidate namespace.

trails' `findByNamespace` (`packages/trailties/src/command.ts`) instead
`import()`s `cli.ts` and calls `createProgram()`, which loads every command
module and builds the whole Commander program for every lookup. It carries
`@missingRailsCall lookup — PERMANENT`. That receipt is only true while trails'
commands are Commander factories rather than `Rails::Command::Base` subclasses.
`UnusedRoutesCommand` is the first `Base` subclass (trails#8247), and it
registers in `hiddenCommands()`.

## Acceptance criteria

- `command.ts` gains `lookup(namespaces)`, which dynamically imports only the
  `commands/<namespace>.ts` candidates, and `subclasses` is populated the way
  `base.rb:59-65` (`inherited`) does. A class-definition-time registration
  stands in for `inherited` (§ "`inherited` is deferred" in CLAUDE.md).
- `findByNamespace` searches `Base` subclasses by `namespace()` for commands
  ported onto `Base`, and falls back to the Commander program only for commands
  not yet ported.
- `findByNamespace` / `invokeRake` are synchronous again, with no `import("./cli.js")`.
  trails#8247 made them async only to break the eager command.ts -> cli.ts ->
  commands/\*.ts -> command/base.ts -> command.ts cycle. The converged shape seats
  `Rails::Command` (its `hidden_commands` ivar and `HELP_MAPPINGS`) on a
  zero-import namespace object, as CLAUDE.md § "Call-time constant resolution"
  describes, so command/base.ts no longer imports command.ts.
- The `@missingRailsCall lookup — CONVERGEABLE find-by-namespace-lookup-loads-only-candidates`
  receipt on `findByNamespace` is removed.
