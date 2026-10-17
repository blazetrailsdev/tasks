---
title: "Create packages/solid-cable as a published workspace package and enroll it in compare"
status: draft
updated: 2026-10-17
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cable"]
deps: ["vendor-solid-cache-queue-cable-gems"]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
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
