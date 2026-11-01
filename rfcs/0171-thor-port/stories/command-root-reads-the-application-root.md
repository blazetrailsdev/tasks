---
title: "command-root-reads-the-application-root"
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

## Context

`Rails::Command.root` / `application_root` (`vendor/rails/v8.0.2/railties/lib/rails/command.rb:101-112`) expand `../..` from `APP_PATH`. They are unported, and bin.ts can set `APP_PATH` to `dist/config/application.js`, where that expansion answers `dist`. `Diffing#gitattributes` therefore uses `Dir.pwd()` (`packages/trailties/src/commands/credentials/credentials-command/diffing.ts`).

## Acceptance criteria

- [ ] `root` and `applicationRoot` are ported in `command.ts` and answer the app root for a `dist` APP_PATH too.
- [ ] `Diffing#gitattributes` reads `root() ?? Pathname.pwd`, and its `@missingRailsCall root` receipt is removed.
