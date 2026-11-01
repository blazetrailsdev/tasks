---
title: "app-base-package-manager-version-readers"
status: ready
updated: 2026-11-01
rfc: "0212-trailties-port"
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

trails#9569 replaced `dockerfile_yarn_version` / `yarn_through_corepack?` (`vendor/rails/v8.0.2/railties/lib/rails/generators/app_base.rb:536-545`) with `dockerfilePnpmVersion` / `isPnpmThroughCorepack` in `packages/trailties/src/generators/app-base.ts`, on the owner's instruction. Both hard-code `pnpm --version`, though `package-manager.ts` also registers yarn and npm, and they keep yarn's `>= 2` corepack threshold, which means nothing for pnpm. Neither has a caller.

## Acceptance criteria

- The version reader answers for the app's selected package manager.
- The corepack predicate has a threshold meaningful for that manager, or is removed if no caller needs it.
- `isPnpmThroughCorepack` matches `yarn_through_corepack?`'s `NoMethodError`-style failure when the version is `false` or nil, or that arm is decided.
