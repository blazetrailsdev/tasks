---
title: "Render parity:api / parity:test numbers from the generated package summary at build time"
status: draft
updated: 2026-11-18
rfc: "0000-website-refresh"
cluster: website-docs
packages: [website]
deps: [website-pages-deploy-workflow]
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3. Every number on the site today is hand-typed: the landing
grid's `coverage` strings (`packages/website/src/routes/+page.svelte:3-8`,
"71%", "95%", …). `pnpm parity:packages` writes
`scripts/parity/output/package-summary.json`
(`scripts/parity/package-summary.ts:3,43`) with one entry per
`packages/<pkg>/package.json`. It joins api-compare output
(`scripts/api-compare/output/`, `:24`) and test-compare output per package.

## Acceptance criteria

- [ ] A VitePress data loader and a prerendered SvelteKit load both read `package-summary.json`, from one shared module in `packages/website/`.
- [ ] Each figure is rendered with the commit SHA it was measured at. A missing or unreadable output renders "—" and the build still passes.
- [ ] `.github/workflows/pages.yml` does not run parity. It downloads `package-summary.json` from the newest `parity-outputs-<sha>` artifact of a successful `main` CI run (`.github/workflows/ci.yml:2584-2601`, uploaded on push with `retention-days: 90`), with `actions: read`. The rendered SHA is that artifact's.
- [ ] `git grep -E 'coverage: "[0-9]+%"' packages/website` is empty.
- [ ] The download adds under a minute to the Pages job, and PR CI is unchanged. Local `pnpm --filter @blazetrails/website build` reads a local `scripts/parity/output/package-summary.json` if one is present.
