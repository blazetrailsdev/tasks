---
title: "AppGenerator Dockerfile reads dockerfilePnpmVersion / isPnpmThroughCorepack as Dockerfile.tt does"
status: draft
updated: 2026-11-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AppGenerator`'s Dockerfile (`packages/trailties/src/generators/rails/app/app-generator.ts`, the build stage near `RUN ${this.packageManager === "pnpm" ? "corepack enable pnpm && pnpm install" ...}`) hardcodes the JS install. Rails' template reads the version helpers: `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/Dockerfile.tt:36-51` emits `ARG YARN_VERSION=<%= dockerfile_yarn_version %>` and branches on `yarn_through_corepack?` (`corepack enable && yarn set version $YARN_VERSION` against `npm install -g yarn@$YARN_VERSION`), then `:68-71` copies the lockfile and runs `yarn install --immutable`. trails ported `dockerfilePnpmVersion` / `isPnpmThroughCorepack` (`packages/trailties/src/generators/app-base.ts`, `app_base.rb:536-545`) in trails#9649, but they have no caller.

## Acceptance criteria

- The Dockerfile emits `ARG PNPM_VERSION=${await this.dockerfilePnpmVersion()}` and branches on `isPnpmThroughCorepack()` in Rails' order (`corepack enable && pnpm set version`-equivalent / `npm install -g pnpm@$PNPM_VERSION`), inside the `using_node?` guard.
- The install step mirrors `Dockerfile.tt:68-71` (`pnpm install --frozen-lockfile`).
- An app-generator test covers both corepack arms.
