---
title: "published-trails-new-finds-solid-cache-install"
status: draft
updated: 2026-11-27
rfc: "0100-package-size-and-publish-shape"
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

Running the published generator without `--skip-install`
(`npx -p @blazetrails/trailties@0.1.0-alpha0.1 trails new blog --skip-git`, Node 26)
creates the app, then runs `trails solid_cache:install solid_queue:install solid_cable:install`
and fails: `Unrecognized command "solid_cache:install" (Trails::Command::UnrecognizedCommandError)
Did you mean?  solid_queue:install`. `--skip-install` followed by `pnpm install` works, so
README.md (trails#10850) documents that path. Rails runs the same step from
`vendor/rails/v8.0.5.2/railties/lib/rails/generators/rails/app/app_generator.rb` (`run_solid`),
with each gem's install task registered by the gem's railtie.

## Acceptance criteria

- `trails new blog` from the published `@blazetrails/trailties@alpha` completes, with `solid_cache:install` found.
- README.md's getting-started block drops `--skip-install` and the separate `pnpm install`.
