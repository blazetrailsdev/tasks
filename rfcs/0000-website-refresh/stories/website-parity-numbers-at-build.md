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
(`scripts/parity/package-summary.ts:3,43`), one entry per
`packages/<pkg>/package.json`. It joins api-compare output
(`scripts/api-compare/output/`, `:24`) and test-compare output per package.

## Acceptance criteria

- [ ] A VitePress data loader and a prerendered SvelteKit load both read `package-summary.json`, from one shared module in `packages/website/`.
- [ ] Each figure is rendered with the commit SHA it was measured at. A missing or unreadable output renders "—" and the build still passes.
- [ ] `.github/workflows/pages.yml` runs `pnpm parity:packages` (and whatever it needs from `parity:api` / `parity:test`) before the site build.
- [ ] `git grep -E 'coverage: "[0-9]+%"' packages/website` is empty.
- [ ] The PR body states the extra wall time the parity step adds to the Pages job. PR CI is unchanged.
