---
title: "Lint boundary: vite-assets and vite-trails stay app-asset-only"
status: draft
updated: 2026-11-12
rfc: "0000-hotwire-via-vite"
cluster: vite
packages: [scripts, trailties, vite-trails]
deps: [vite-trails-package-and-tag-helpers]
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

`@blazetrails/vite-assets` (the `vite_ruby` port) and `@blazetrails/vite-trails`
serve a generated app's browser assets. trails also uses Vite as toolchain:
vitest, trailties' test-only `trailsPlugin` / `dev-server.ts`, and the website
build. The ratified ruling says the two never mix. This story makes that a
lint error, not a convention.

## Acceptance criteria

- An ESLint `no-restricted-imports` rule allows `@blazetrails/vite-assets` and
  `@blazetrails/vite-trails` only from `packages/vite-trails`,
  `packages/turbo`, `packages/stimulus` and the generated-app
  templates under `packages/trailties/lib/generators`.
- The same rule bans `packages/vite-assets` and `packages/vite-trails` from
  importing `trailties/lib/server/vite-plugin` or `dev-server`.
- The rule's message cites the ratified CLAUDE.md section.

## Verification

- `pnpm lint` passes, and a fixture import from `packages/trailties/lib/server`
  into `@blazetrails/vite-assets` fails with the rule's message.
