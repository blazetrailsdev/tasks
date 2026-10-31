---
title: "trails-tsc: a hasMany through's `source` does not resolve to its target class"
status: draft
updated: 2026-10-31
rfc: "0035-tsserver-editor-plugin"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Story` in trailmap declares `this.hasMany("deps", { through: "storyDeps", source: "dependsOn" })`, with the join model `StoryDep` in another file (`app/models/joins.ts`). Virtualized, `story.deps` is typed `AssociationProxy<Dep>` and the build fails with TS2304 `Cannot find name 'Dep'`: the fallback singularizes the association name instead of following `source`. `rfcDeps` gives `RfcDep` the same way. The logic is in `packages/activerecord-cli/src/type-virtualization/resolve-target.ts`.

Found by `typecheck-trailmap-with-trails-tsc-and-drop-model-declares`.

## Acceptance criteria

- `deps` above types as `AssociationProxy<Story>` with the join model in a separate file, with a test.
- A through that cannot be resolved falls back to `Base` rather than an undefined name.
- trailmap's two `declare`s naming this story can be deleted after a re-vendor.
