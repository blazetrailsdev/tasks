---
title: "console-prompts-before-models-load"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails console` (`packages/trailties/src/commands/console.ts:31-72`) starts
the REPL (`repl.start({ prompt: "trails> " })`) and only then imports
`app/models/*`. Input typed or piped before that import finishes is evaluated
with no models in scope. `printf 'const p = await Post.first()\np.title\n' | bin/trails console`
prints `Uncaught TypeError: Cannot read properties of undefined (reading 'title')`,
and the output shows `trails> Loaded 2 model(s) from app/models/`, with the
prompt ahead of the load message.

Rails boots the app before it starts IRB: `ConsoleCommand#perform` runs `boot_application!`
and only then `Rails::Console.start`
(`vendor/rails/v8.0.2/railties/lib/rails/commands/console/console_command.rb:85-88`).

Found re-running the root README quickstart (PR #8195) on `main` at `c19bfc0aee`.

## Acceptance criteria

- [ ] Models are loaded before the REPL accepts input.
- [ ] A piped-stdin test covers the first line reading a model.
