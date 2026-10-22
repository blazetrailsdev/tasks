---
title: "Create packages/solid-queue as a published workspace package and enroll it in compare"
status: in-progress
updated: 2026-10-22
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: ["vendor-solid-cache-queue-cable-gems"]
deps-rfc: []
est-loc: 200
pr: trails#9250
claim: "2026-10-22T19:45:16Z"
assignee: "solid-queue-package-skeleton"
blocked-by: null
closed-reason: null
---

## Context

Same shape as `solid-cache-package-skeleton`. Takes
`@blazetrails/activerecord` and `@blazetrails/activejob` as dependencies.

## Acceptance criteria

- The package builds, and CI runs its tests on all three adapter lanes
  (`ci.yml` registrations and the guard fixture).
- The source turns on `compareApi` / `compareTests`.
- No empty stub files: only `package.json` / `tsconfig.json` / entry point.
