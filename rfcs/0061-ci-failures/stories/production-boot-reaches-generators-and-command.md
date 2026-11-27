---
title: "production-boot-reaches-generators-and-command"
status: ready
updated: 2026-11-27
rfc: "0061-ci-failures"
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

`packages/trailties/test/production-boot.trails.test.ts` > "reaches neither playwright nor vite" fails at `:88`. It passed on main up to 625f16e67b. It has not run since 2f2c330619 (#10804), because the Trailties lane exited 0 having run no files. trails#10835 revives the lane and skips this test, pointing at this story.

Two PRs that merged while the lane was silent reach the modules the test forbids (`/trailties/lib/(?:command|commands|generators)(?:/|\.ts$)/`):

- #10822 (c0f59804b6) changed `packages/trailties/lib/engine.ts` `loadGenerators`. It used to call `await import(generators)`, where `generators` was a `@noRailsEquivalent` variable that kept the graph out of static analysis. It now calls a literal `await import("./generators.js")`, so the playground bundle includes the generators. The test's `SPECIFIER` regex counts a dynamic `import("…")` as reachable: index.ts -> engine.ts -> generators.ts -> generators/base.ts, generators/actions.ts, command/behavior.ts.
- #10811 (ab48a87bde, operator RACK_ENV ruling) made `packages/trailties/lib/server/boot.ts:7` import `environment` from `../command.js`, as `railties/lib/rails/commands/server/server_command.rb:227-229` calls `Rails::Command.environment`. So server/index.ts -> server/boot.ts -> command.ts.

## Acceptance criteria

- Decide whether production boot may reach `command.ts` and the generators graph through a method-level dynamic import, then either converge the two edges or narrow the guard to what production boot actually evaluates.
- Un-skip "reaches neither playwright nor vite", and make it pass.
