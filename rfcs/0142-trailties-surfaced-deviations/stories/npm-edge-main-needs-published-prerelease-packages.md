---
title: "npm-edge-main-needs-published-prerelease-packages"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
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

`trails new --edge` / `--main` with `--package-manager npm` writes `github:blazetrailsdev/trails#<branch>` (`packages/trailties/lib/generators/app-base.ts`, `trailsPackageEntry`), which installs the monorepo root. npm has no git-subdirectory specifier, and `VALID_PACKAGE_MANAGERS` (`packages/trailties/lib/generators/trails/app/app-generator.ts:658`) admits only pnpm and npm, so yarn's `workspace=` parameter is unreachable. The repo has no publish workflow (`.github/workflows` holds only ci, pages, perf), so there is no per-branch prerelease dist-tag or tarball to point npm at.

## Acceptance criteria

- CI publishes each `@blazetrails/*` package for `main` (and edge branches) under a prerelease dist-tag or per-branch tarball URL.
- `trailsPackageEntry` under npm writes that specifier for `--edge` / `--main`.
