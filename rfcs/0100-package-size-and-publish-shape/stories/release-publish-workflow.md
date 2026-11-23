---
title: "Release workflow publishes every public package together"
status: in-progress
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10634
claim: "2026-11-23T10:02:31Z"
assignee: "classify-published-and-private-packages"
blocked-by: null
closed-reason: null
---

## Context

There is no publish job in `.github/workflows/` and no release script. A
release must publish every public package at the lockstep version in one run,
so no consumer ever sees a partial set on the registry.

## Acceptance criteria

1. A GitHub Actions workflow publishes every public package on a version tag
   (or on a changesets release PR merge), from a clean `pnpm build`.
2. It publishes with npm provenance (`--provenance`, `id-token: write`) and
   uses an npm token or trusted publishing, never a personal token in the
   repo.
3. A dry-run mode (`pnpm -r publish --dry-run`) runs on PRs that touch
   release config.
4. A failed publish midway is recoverable: rerunning the job skips versions
   already on the registry.
5. The RFC 0100 publish-shape stories are listed as prerequisites in the
   workflow's README section; no real publish runs before they land.
