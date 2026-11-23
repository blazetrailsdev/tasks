---
title: "trailmap CI installs each new @blazetrails alpha and runs build/test/smoke"
status: ready
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: ["trailmap-installs-published-packages-from-npm"]
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

Once trailmap installs from the registry, a regression in publish shape only surfaces after
someone bumps it by hand. trailmap should be the canary for each trails release.

## Acceptance criteria

1. trailmap has a CI job (or scheduled workflow) that installs the newest `@blazetrails/*`
   `alpha` dist-tag, then runs `pnpm build`, `pnpm test` and `pnpm smoke`.
2. A failure names the trails version that broke it.
3. The trails release process in the RFC README says to check that job before promoting a
   prerelease to `latest`.
