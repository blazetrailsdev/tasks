---
title: "server-path-trailties-console-integration-session"
status: ready
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
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

`packages/trailties/lib/commands/console/tsrepl-console.ts` (`NewSession#execute`)
builds `new ActionDispatch.Integration.Session(app)`, which Rails reaches through
`autoload` (`vendor/rails/v8.0.2/railties/lib/rails/commands/console/irb_console.rb:35`).
Since `server-path-actionpack-testing`, `ActionDispatch::Integration` is seated only
by `@blazetrails/actionpack/testing`, so the console awaits that import, and
`scripts/layout/server-path-closure.ts` finds `packages/actionpack/dist/testing.js`
reachable through `trailties/dist/commands/console/tsrepl-console.js` (via
`generators.js` → `command/behavior.js` → `commands/console.js`). That is one row of
`scripts/layout/server-path-closure-exclude.json` naming this story.

## Acceptance criteria

- [ ] No non-testing export reaches `actionpack/dist/testing.js` through the console
      command (e.g. `command/behavior.js` stops statically reaching `commands/console.js`,
      or the console command is loaded only from the CLI entry).
- [ ] The row is deleted from `server-path-closure-exclude.json`.
