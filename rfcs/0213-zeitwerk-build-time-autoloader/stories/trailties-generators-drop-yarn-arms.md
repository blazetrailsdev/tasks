---
title: "trailties-generators-drop-yarn-arms"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
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

The repo owner ruled trails is pnpm only (trails#9634), and `conventions.ts` maps `yarn` to `pnpm` for paths. yarn is still selectable in `packages/trailties/src/package-manager.ts` (the `yarn` adapter), `generators/rails/app/app-generator.ts:27-30,175-183` (`VALID_PACKAGE_MANAGERS`, `yarn.lock`) and `generators/rails/channel/channel-generator.ts`. Rails counterparts: `dockerfile_yarn_version`, `yarn_through_corepack` in `railties/lib/rails/generators/app_base.rb`.

## Acceptance criteria

- No yarn arm remains in trailties generators or the package-manager registry, or the owner rules which package managers stay.
- Rails' yarn-named generator members map to their pnpm spelling in `scripts/parity/conventions.ts`.
