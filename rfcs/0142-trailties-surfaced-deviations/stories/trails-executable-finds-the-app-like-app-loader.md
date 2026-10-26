---
title: "The trails executable walks up to bin/trails, as Rails::AppLoader.exec_app does"
status: draft
updated: 2026-10-26
rfc: "0142-trailties-surfaced-deviations"
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

The bare `trails` executable finds its application by looking only in the current directory. `packages/trailties/src/bin.ts:8-19` checks `dist/config/application.js`, then `config/application.ts`, in `Dir.pwd()`, and goes no further.

Rails' `rails` executable is `railties/lib/rails/cli.rb:7`, which calls `Rails::AppLoader.exec_app` (`railties/lib/rails/app_loader.rb:45-71`). That walks up from the current directory, one `Dir.chdir("..")` at a time, until `find_executable` (`:73-75`) finds one of `EXECUTABLES` (`:11`, `bin/rails`). It then execs that binstub, which sets `APP_PATH` itself. So `rails routes` works from any subdirectory of an app, and `trails routes` does not.

Found on trails#9354, which made `bin/trails` set the app path from its own directory, as `bin/rails.tt:2` does.

## Converged shape

- The `trails` executable runs an `AppLoader.execApp` port. It walks up to the first directory holding `bin/trails`, and runs it.
- `bin.ts`'s own `dist`/`config` search goes away. Only the binstub decides the app path, as in Rails.

## Acceptance criteria

- [ ] `trails routes` run from `app/models` of a generated app boots that app.
- [ ] `bin.ts` no longer probes `Dir.pwd()` for an application file.
