---
title: "Create packages/solid-cable as a published workspace package and enroll it in compare"
status: done
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cable"]
deps:
  - vendor-solid-cache-queue-cable-gems
  - actioncable-package-skeleton
deps-rfc: []
est-loc: 200
pr: trails#9439
claim: "2026-10-29T15:26:22Z"
assignee: "solid-cable-package-skeleton"
blocked-by: null
closed-reason: null
priority: 5
---

## Context

Same shape as `solid-cache-package-skeleton` and RFC 0177's
`actioncable-package-skeleton`. Takes `@blazetrails/activerecord`,
`@blazetrails/actioncable` and `@blazetrails/activejob` as dependencies.

## Acceptance criteria

- The package builds, and CI runs its tests on all three adapter lanes
  (`ci.yml` registrations and the guard fixture).
- The source turns on `compareApi` / `compareTests`.
- No empty stub files: only `package.json` / `tsconfig.json` / entry point.
