---
title: "pnpm smoke fails locally on the supply-chain policy check for vendored packages"
status: draft
updated: 2026-11-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/smoke-boot.sh:26` runs `pnpm install --frozen-lockfile`. On the dev box with pnpm 10.27.0, on trailmap#108's branch, it stops with ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION: 31 entries, with `GET registry.npmjs.org/@blazetrails%2F*` returning 404, because those packages are vendored tarballs and not on the registry. `pnpm install --frozen-lockfile` at the worktree root reported "Already up to date", and the CI `boot` job passes. `minimumReleaseAge` is not set in `pnpm-workspace.yaml` or ~/.npmrc, so where the policy comes from is still unknown.

## Acceptance criteria

- Find where the policy comes from and why it applies to the smoke run.
- `pnpm smoke` runs locally on a fresh worktree without weakening the policy for registry packages.
