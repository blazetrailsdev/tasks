---
title: "generator-and-command-bodies-bypass-thor-say"
status: draft
updated: 2026-09-25
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

`generator-log-drops-the-quiet-guard-and-say-status` ported Thor's
`Shell::Basic#say` / `#say_status` onto `GeneratorBase`
(`packages/trailties/src/generators/base.ts`). With `say` now a ported name,
`pnpm parity:api:calls` measures two Rails bodies whose trails ports still
write straight to a sink instead of calling it. Both carry a
`@missingRailsCall say — CONVERGEABLE` receipt pointing here:

- `Rails::Command::UnusedRoutesCommand#perform`
  (`vendor/rails/railties/lib/rails/commands/unused_routes/unused_routes_command.rb:46`)
  is `say(inspector.format(formatter, routes_filter))`.
  `packages/trailties/src/commands/unused-routes.ts` `perform` uses
  `console.log`, and `UnusedRoutesCommand` does not derive from a command base
  carrying Thor's shell, so it has no `say` to call.
- `Rails::Generators::ModelHelpers#initialize`
  (`vendor/rails/railties/lib/rails/generators/model_helpers.rb`) calls `super`
  and then `say`s the plural / irregular warnings.
  `packages/trailties/src/generators/rails/model/model-generator.ts`'s
  constructor normalizes the name BEFORE `super` (it feeds the normalized name
  into `NamedBase`'s name assignment), so it cannot reach `this.say` and hands
  `options.output` to `normalizeModelName` (`model-helpers.ts`) as its sink.

## Acceptance criteria

- [ ] `UnusedRoutesCommand#perform` calls `say`, on a command base that carries
      Thor's shell the way `Rails::Command::Base < Thor` does.
- [ ] `ModelGenerator`'s constructor runs `super` first, as Rails does, and
      the warnings go through `this.say`.
- [ ] Both `@missingRailsCall say` receipts are deleted, and
      `pnpm parity:api:calls` is green.
