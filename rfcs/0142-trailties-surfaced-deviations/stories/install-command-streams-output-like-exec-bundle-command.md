---
title: "installCommand streams install output like exec_bundle_command"
status: draft
updated: 2026-11-02
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`exec_bundle_command` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:662-669`) runs `system`, so the install's output and errors reach the terminal unless `options[:quiet]` sends stdout to `File::NULL`. trails' `AppBase#installCommand` (`packages/trailties/src/generators/app-base.ts`) calls `packageManagerInstall` (`packages/trailties/src/package-manager.ts:74`), which captures output with `spawnSync` and is the only result reported. Since trails#9609 `installCommand` ignores that result, so a failed `trails new` install is silent.

## Acceptance criteria

- `installCommand` has an `execInstallCommand`-shaped step mirroring `exec_bundle_command`: output is inherited, and stdout is discarded only under `quiet`.
- A failed install's stderr reaches the terminal, with a test covering `quiet` and non-`quiet`.
