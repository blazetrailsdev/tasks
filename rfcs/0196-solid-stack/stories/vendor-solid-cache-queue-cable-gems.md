---
title: "Vendor solid_cache, solid_queue and solid_cable at the Rails 8.0.2 lockfile versions"
status: done
updated: 2026-10-22
rfc: "0196-solid-stack"
cluster: solid-stack
packages: []
deps: []
deps-rfc: []
est-loc: 150
pr: trails#9243
claim: "2026-10-22T19:07:26Z"
assignee: "vendor-solid-cache-queue-cable-gems"
blocked-by: null
closed-reason: null
---

## Context

`vendor/sources.ts` registers `rails`, `rack`, `thor` and others, but no Solid
gem. `vendor/rails/v8.0.2/Gemfile.lock:577-586` pins `solid_cable (3.0.7)`,
`solid_cache (1.0.7)` and `solid_queue (1.1.3)`. Each gem is its own GitHub
repo (`rails/solid_cache`, `rails/solid_queue`, `rails/solid_cable`), tagged
`v<version>`.

## Acceptance criteria

- Three `UpstreamSource` entries, git origins at the tags above, `libPath` /
  `testPath` set. `compareApi` / `compareTests` stay `false` until each
  package exists, so no empty package enters the compare.
- `pnpm vendor:fetch` populates `vendor/solid_cache/v1.0.7/` and the other two
  roots, and `vendor/sources.lock.json` records the revisions.
- `start-worktree.sh` populates the new roots in every worktree.
- `vendor/sources.test.ts` passes.
