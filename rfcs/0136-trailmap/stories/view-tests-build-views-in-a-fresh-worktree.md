---
title: "View and DOM tests build .trails/views themselves in a fresh worktree"
status: in-progress
updated: 2026-11-18
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: trailmap#171
claim: "2026-11-18T22:21:35Z"
assignee: "view-tests-build-views-in-a-fresh-worktree"
blocked-by: null
closed-reason: null
---

## Context

In a fresh trailmap worktree, `pnpm install` then `pnpm vitest run test/assets/dashboard-dom.test.ts test/controllers/dashboard-controller.test.ts` fails with `LoadError: cannot load such file -- <worktree>/.trails/views/dashboard/index.html.tse.js` (10 failures). CI passes only because `.github/workflows/ci.yml` runs `NODE_ENV=test pnpm exec trails-tsc-views build --views app/views` as a separate step before the tests. Running that by hand fixes it locally (seen on trailmap#162). Nothing in `vitest.config.ts` or the README's test instructions says to do this, so an agent reads the reds as its own regression.

## Acceptance criteria

- A vitest `globalSetup` (or an equivalent single entry point) builds the views when `.trails/views` is missing or stale, so `pnpm test` and a single `pnpm vitest run <file>` both work in a fresh worktree.
- The CI step either goes away or stays as a check only, not a precondition nobody wrote down.
