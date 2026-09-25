---
title: "rails:find prints versioned paths"
status: draft
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: [nest-vendored-clones-under-a-version-directory]
deps-rfc: []
est-loc: 90
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm rails:find <query>` is how an agent gets the `file:line` it then pastes into
a `Mirrors:` line, so its output is the upstream of every citation the gate
checks. `scripts/rails-find/core.ts` builds `vendor/rails/...` display paths in 24
places and `scripts/rails-find/core.test.ts` asserts on 4 of them; both were
excluded from the bulk sweep because these are constructed output, not citations.

## Acceptance criteria

- Every path `rails:find` prints carries the active version segment, derived from
  the same `vendor/sources.ts` helper the resolvers use — not a literal.
- `scripts/rails-find/core.test.ts` asserts the versioned shape, with existing
  test names unchanged.
- The manifest-backed and grep-fallback modes both print versioned paths, and the
  mode tag is unchanged.
- `pnpm vendor:recite --check` is clean over `scripts/rails-find/`.
