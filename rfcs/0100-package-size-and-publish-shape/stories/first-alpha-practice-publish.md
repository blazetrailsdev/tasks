---
title: "Publish a first 0.1.0-alpha prerelease of every public package from release.yml"
status: done
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 1
pr: trails#10659
claim: "2026-11-23T18:59:09Z"
assignee: "first-alpha-practice-publish"
blocked-by: null
closed-reason: null
---

## Context

`release.yml` (trails origin/main) publishes on a `v*` tag, but nothing has been published:
`npm view @blazetrails/activerecord` 404s on 2026-11-23. Every consumer-side check in this RFC
(`single-copy-shared-singletons-after-first-publish`, the trailmap stories) needs real
registry tarballs.

## Acceptance criteria

1. A `0.1.0-alpha0.N` prerelease of every public package is published from `release.yml`
   on a `v*` tag, under a non-`latest` dist-tag (e.g. `alpha`).
2. `npm view @blazetrails/trails@alpha dependencies` shows exact internal pins at the same version.
3. The tag, version and dist-tag used are recorded in the RFC README.
