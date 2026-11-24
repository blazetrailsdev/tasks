---
title: "Rails-private credit keys by owner and static, not file-wide name"
status: ready
updated: 2026-11-24
rfc: "0061-ci-failures"
cluster: null
packages: []
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

`countTsInternalNames` (`scripts/api-compare/extra-surface.ts`, trails#10297) and the privates lane's `credited` column (`scripts/api-compare/privates-surface.ts`, `buildPrivatesReport`) both match TS names against one per-file set from `collectAllowedNames(..., "private")`. That set ignores which Ruby class/module owns the name and whether it is an instance or class method, and the walk also adds a delegated owner's privates (`extra-surface.ts` ~:1692-1697). So an invented `@internal` member whose name collides with any Ruby private in the mirrored `.rb` is credited and not counted (raised in review of trails#10297).

## Acceptance criteria

- The private walk records owner and static/instance per name (like `rails-private-methods.json`'s `instanceFiles` / `entityInstanceFiles`).
- `countTsInternalNames` and `buildPrivatesReport` both match on (owner, isStatic, name), so the two counts still agree.
- Unit test: an invented `@internal` member colliding with a private of a different class in the same `.rb` is counted.
- Marks narrowed only with the tighten commands. A mark that rises is an operator decision, not a reseed.
