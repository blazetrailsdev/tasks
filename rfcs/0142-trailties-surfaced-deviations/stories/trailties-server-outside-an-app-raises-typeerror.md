---
title: "trailties server run outside an app's bin/trails crashes on Trails.application null instead of a clear message"
status: draft
updated: 2026-11-17
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while booting trailmap for trailmap#153 screenshots.

`pnpm exec tsx node_modules/@blazetrails/trailties/bin/trails.js server -p 3871` from an app root
crashes:

    TypeError: Cannot read properties of null (reading 'root')
      at trailties/dist/commands/server.js:216  Dir.chdir(Trails.application.root());

The app's own `bin/trails server` works, because it loads the application first. The framework bin
does not, and the server command dereferences `Trails.application` without a guard.

Rails: `rails server` outside an application prints usage / the "new application" help via
`Rails::Command::ApplicationCommand` and the `server` command requires `APP_PATH`
(`railties/lib/rails/commands/server/server_command.rb` `require_application_and_environment!`),
failing with a clear message rather than a nil dereference.

## Acceptance criteria

- `trailties/bin/trails.js server` run where no application is loaded either loads the app from the cwd as `bin/trails` would, or exits with a clear message naming `bin/trails`, never a TypeError.
- A trailties test covers the no-application case.
