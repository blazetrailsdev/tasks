---
title: "trailmap: Story.touchingPackage resolves a story's packages from its own list, its paths, then a one-package RFC"
status: claimed
updated: 2026-11-05
rfc: "0222-trailmap-package-pages"
cluster: package-pages
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-05T16:21:48Z"
assignee: "emit-package-summary-json"
blocked-by: null
---

## Context

Measured 2026-11-05 on the shared tasks.db: of 1,682 open stories, 609 carry
their own `story_packages`; of the 1,073 without, 949 sit under an RFC listing
more than three packages (`0023-surfaced-deviations` lists 16), and 791 of
those name a `packages/<pkg>/…` path in `story_paths`. Inheriting the RFC list
would misattribute; the RFC's "Story → package attribution" section fixes the
order. Models: `trailmap/app/models/story.ts`, `story-package.ts`,
`story-path.ts`.

## Acceptance criteria

- [ ] `Story.touchingPackage(name)` matches own `story_packages`; otherwise a
      `story_paths` row under `packages/<name>/`; otherwise an RFC whose
      `packages` has exactly one entry equal to `name`.
- [ ] `Story.unattributed()` returns stories none of the three rules match.
- [ ] Tests cover each rule and the precedence (an own list beats paths).
