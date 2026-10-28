---
title: "converge-generators-actions-generate-onto-rails-command"
status: draft
updated: 2026-10-28
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

`Rails::Generators::Actions#generate` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb:268-273`)
logs, sets `abort_on_failure: !options[:inline]` and calls `rails_command "generate #{what} ..."`
(`:298-310`), which either runs `Rails::Command.invoke` inline under `in_root` or goes through
`execute_command :rails` (`:461-473`, `in_root { run(...) }`).

trails' `generate` (`packages/trailties/src/generators/actions.ts`) instead pushes onto
`pendingGenerators`, consumed by `commands/app.ts` and
`generators/rails/authentication/authentication-generator.ts#runPendingGenerators`. `rails_command`
is unported; there is no ruby-compat `Shellwords.split` for its inline arm.
`afterInstall` / `afterInstallCallbacks` live in the same file but belong to `app_base.rb`.

Also: `execute_command` now runs `bin/<executor>` as Rails does, so the authentication generator's
`executeCommand("pnpm", "install --silent")` runs `bin/pnpm`; Rails' analogue is `execute_command :bundle`
against `bin/bundle`. Decide the trails executor (a `bin/` script or `pnpm` direct) here.

## Acceptance criteria

- [ ] `generate` and `railsCommand` mirror Rails' bodies; `pendingGenerators` is gone and its two consumers go through `railsCommand`.
- [ ] `afterInstall` moves to the file mirroring `app_base.rb`.
- [ ] The authentication generator's install step runs a command that exists in a generated app.
