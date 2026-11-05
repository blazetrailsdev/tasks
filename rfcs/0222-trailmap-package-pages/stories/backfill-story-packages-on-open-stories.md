---
title: "tasks: give every open story with no usable package attribution an explicit packages list"
status: ready
updated: 2026-11-05
rfc: "0222-trailmap-package-pages"
cluster: package-pages
packages: []
deps: [story-touching-package-scope]
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

After `story-touching-package-scope`, about 160 open stories (2026-11-05
count) match no attribution rule: no own `packages`, no `packages/<pkg>/` path
in `story_paths`, and an RFC listing zero or several packages. They would
appear on no package page. `packages` is markdown-owned (`src/ingest.ts:57`),
so this is a prose edit in the tasks repo.

## Acceptance criteria

- [ ] Every open story `Story.unattributed()` returns gets a `packages:` list
      read off its body's file citations; a story that touches no package
      follows this rule: a trails story lists the packages whose files it
      cites; a story on trails' root tooling (`scripts/`, `.github/`, `eslint/`)
      lists `scripts`, the workspace package those live in; a trailmap or
      tasks story lists the trails packages it exercises, as RFC 0200's
      stories do (`packages: [actionview]`); a story none of these fit keeps
      `packages: []` and the PR body names it with a reason.
- [ ] `Story.unattributed()` returns only the stories the PR body names, at
      the commit the backfill merges; `validate-warns-on-unattributed-story`
      keeps it there.
- [ ] Docs-only: no code change.
