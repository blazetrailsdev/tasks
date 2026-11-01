---
title: "Port Rails::Command.root and ARGV.replace for generate and destroy"
status: draft
updated: 2026-11-01
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

# Port Rails::Command.root and ARGV.replace for generate and destroy

## Context

`vendor/rails/v8.0.2/railties/lib/rails/command.rb:103-113` defines `root` / `application_root`, which `generate_command.rb:26` and `destroy_command.rb:25` pass as `destination_root`. `generate_command.rb:24` calls `ARGV.replace(args)`. `packages/trailties/src/commands/generate.ts` and `destroy.ts` pass `Dir.pwd()` and skip the replace, with no `@missingRailsCall` receipt because the call gate reds both as stale: `command.ts` has no `root`, a built app's `APP_PATH` is `dist/config/application.js` so `../..` answers `dist/`, and ruby-compat's `argv` is read-only.

## Acceptance criteria

- [ ] `root` and `applicationRoot` are ported in `command.ts` and answer the app root for a built app too.
- [ ] Both commands pass `root()` as `destinationRoot`.
- [ ] `GenerateCommand#perform` replaces ARGV.
