---
title: "tasks: validate warns on a new or modified story no package-attribution rule matches"
status: draft
updated: 2026-11-05
rfc: "0222-trailmap-package-pages"
cluster: package-pages
packages: [scripts]
deps: [story-touching-package-scope]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The backfill brings the open unattributed count to its floor once; new
stories regress it the next day. `Story.touchingPackage`
(`story-touching-package-scope`) defines attribution: own `packages`, else a
`packages/<pkg>/` path the body cites, else a one-package RFC.
`scripts/validate.mjs` in the tasks repo already checks a story's `packages`
against its RFC's list; that is the place to check this too.

## Acceptance criteria

- [ ] `node scripts/validate.mjs` prints a warning naming each story added or
      modified relative to `origin/main` that none of the three rules
      attribute, applying the same three rules over markdown.
- [ ] A warning, not an error, so a story that genuinely touches no package
      can still merge; the warning text names the rule from
      `backfill-story-packages-on-open-stories`.
- [ ] A test over a fixture RFC covers each rule and the warning.
