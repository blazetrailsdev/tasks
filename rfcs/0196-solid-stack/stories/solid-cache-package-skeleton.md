---
title: "Create packages/solid-cache as a published workspace package and enroll it in compare"
status: in-progress
updated: 2026-11-12
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cache"]
deps: ["vendor-solid-cache-queue-cable-gems"]
deps-rfc: []
est-loc: 250
pr: trails#10030
claim: "2026-11-12T14:41:33Z"
assignee: "solid-queue-recurring-enqueue-event-flake"
blocked-by: null
closed-reason: null
priority: 9
---

## Context

Model the package on `packages/globalid/` (published, `"type": "module"`,
`dist/` entry points, `tsc` build), as `actioncable-package-skeleton` in
RFC 0177 does. The gemspec depends on `activerecord`, `activejob` and
`railties`. Take `@blazetrails/activerecord` and `@blazetrails/activesupport`
as dependencies, and add the others only when a ported file needs them.

## Acceptance criteria

- `packages/solid-cache` builds, and CI runs its tests on all three adapter
  lanes (see memory: a new package needs `ci.yml` registrations and the guard
  fixture).
- The solid_cache source turns on `compareApi` / `compareTests`.
- No empty stub files: the skeleton ships with the first real module, or with
  only `package.json` / `tsconfig.json`.
