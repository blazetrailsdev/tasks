---
title: "authentication-enable-bcrypt-through-execute-command"
status: done
updated: 2026-11-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9809
claim: "2026-11-06T22:47:06Z"
assignee: "authentication-enable-bcrypt-through-execute-command"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::AuthenticationGenerator#enable_bcrypt`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/authentication/authentication_generator.rb:40-47`)
checks the Gemfile for `gem "bcrypt"`. When it is there, it uncomments the line and runs
`execute_command :bundle, "install --quiet"`. Otherwise it runs `execute_command :bundle, "add bcrypt", capture: true`.
trails' `enableBcrypt` (`packages/trailties/src/generators/trails/authentication/authentication-generator.ts`)
edits `package.json` by hand and runs `pnpm install --silent` through Thor `run`. It does not use
`executeCommand`, because `executeCommand` (`generators/actions.ts`, mirroring `actions.rb:461-473`) runs
`bin/<executor>`, and a generated app has no `bin/pnpm`.

## Acceptance criteria

- `enableBcrypt` follows Rails' branches: the package already listed means `executeCommand("<pm>", "install ...")`, otherwise `executeCommand("<pm>", "add bcryptjs @blazetrails/bcrypt", { capture: true })`.
- The app generator emits the `bin/<pm>` executor this needs, or `executeCommand` grows the decided executor shape, with a citation.
- The `@missingRailsCall execute_command` receipt on `enableBcrypt` is removed.
