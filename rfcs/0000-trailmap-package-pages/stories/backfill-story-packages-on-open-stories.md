---
title: "tasks: give every open story with no usable package attribution an explicit packages list"
status: draft
updated: 2026-11-05
rfc: "0000-trailmap-package-pages"
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
      gets `packages: [scripts]` or the repo it targets, not an invented one.
- [ ] `/packages` shows 0 unattributed open stories after ingest.
- [ ] Docs-only: no code change.
