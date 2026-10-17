---
title: "trailties: '.' entry mirrors rails.rb instead of resolving to the CLI"
status: draft
updated: 2026-10-17
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/package.json` maps `"."` to `./dist/cli.js`. Generated app code imports
`Trails` / `Application` from `@blazetrails/trailties` (`packages/trailties/src/generators/app-generator.ts:405,568,594,606`).
So any entry that is not the CLI, including a Perry AOT binary, loads the CLI module graph.
`cli.ts` loads commander, `Trails`, `Application`, `Engine`, `Trailtie` and the package-manager
exports. Since trails#9015 it no longer loads command modules statically.

Rails' `require "rails"` loads `railties/lib/rails.rb`, which loads no command code.
Commands are reached only through `rails/commands.rb` (`vendor/rails/v8.0.2/railties/lib/rails/commands.rb`).
No existing trailties subpath fills that gap: `./engine` does not export `Trails`, and
`./rails.js` is not in `exports`.

## Acceptance criteria

- `"."` resolves to a module mirroring `rails.rb` (the `Trails` / `Application` surface) that
  imports neither commander nor `cli.ts`.
- The `trails` bin still reaches `createProgram` through `command.ts`.
- Generated `config/application.ts` and `config/routes.ts` keep importing from
  `@blazetrails/trailties`.
- Record the module count and time for `import("@blazetrails/trailties")`, before and after,
  measured with the boot-graph harness.
