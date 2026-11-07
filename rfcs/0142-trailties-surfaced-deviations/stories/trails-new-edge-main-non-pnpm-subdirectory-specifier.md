---
title: "trails new --edge/--main under npm/yarn/bun reach the package subdirectory"
status: draft
updated: 2026-11-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `rails_gemfile_entry` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:460-470`) writes `GemfileEntry.github("rails", "rails/rails", branch)` for `--edge` / `--main`, and Bundler installs the `rails` gem from that branch.

trails#9844 ported those arms in `AppBase#trailsGemfileEntry` (`packages/trailties/src/generators/app-base.ts`). For pnpm it writes `github:blazetrailsdev/trails#<branch>&path:/packages/<dir>`, which installs the package. npm, yarn and bun have no git-subdirectory specifier, so they get the bare `github:blazetrailsdev/trails#<branch>`. That installs the monorepo root, not the `@blazetrails/<dir>` package, so `trails new --edge` / `--main` produces an app that doesn't install under those package managers.

## Acceptance criteria

- `--edge` / `--main` under npm, yarn and bun write a specifier that resolves to the package at `packages/<dir>`. Options: yarn berry's `#workspace=@blazetrails/<dir>&head=<branch>`, a per-branch tarball, or a published prerelease tag. Pick per package manager.
- Extend the trails-only test in `app-generator.trails.test.ts` ("--main without pnpm writes the bare branch specifier") to assert the converged specifier for each package manager.
