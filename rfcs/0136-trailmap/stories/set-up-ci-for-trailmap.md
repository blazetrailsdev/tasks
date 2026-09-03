---
title: "CI for trailmap: typecheck, tests, and a cold-start boot smoke test"
status: draft
updated: 2026-09-03
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap has no CI — no `.github/` at all. It is about to receive the task
domain, become the sole writer of the database the fleet depends on, and serve
the pages agents work from. It needs a gate before that, not after.

What CI has to cover, in rough order of value:

- **Typecheck.** trailmap is the app that should prove zero-declare models, so
  `trails-tsc --schema db/schema.ts` running against the real models is itself a
  framework signal — this is the proving ground, and a typecheck regression here
  is a trails story.
- **Tests.** Model, request and the equivalence gate once it exists.
- **The boot smoke test.** Install from vendored tarballs on a clean checkout,
  boot, and request a page. That single check would have caught three of the
  six framework bugs the boot probe found, all of which only appear from a cold
  start.
- **Node version.** Pinned to what the framework actually requires, so the LTS
  trap that broke the first probe cannot reach CI.

The vendored tarballs make CI cheap and deterministic: no registry access, and
the framework version is whatever `vendor/TRAILS_PIN` says.

## Acceptance criteria

- CI runs typecheck, tests and a cold-start boot smoke test on every PR.
- The smoke test installs from `vendor/` with no network access to a registry.
- The Node version is pinned and matches the framework's floor.
- A red CI blocks merge.
