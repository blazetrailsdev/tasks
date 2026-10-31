---
title: "trails-tsc: synthesize buildX/createX for belongsTo and hasOne"
status: draft
updated: 2026-10-31
rfc: "0035-tsserver-editor-plugin"
cluster: null
packages: ["trails-tsc"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `has_one :settings` and `belongs_to` define `build_settings`, `create_settings` and `create_settings!`. trails-tsc types the reader but none of these, so trailmap's `repo.buildSettings()` needs a hand-written `declare` (`app/models/repository.ts`). The synthesis is in `packages/activerecord-cli/src/type-virtualization/synthesize.ts`.

Found by `typecheck-trailmap-with-trails-tsc-and-drop-model-declares`.

## Acceptance criteria

- `buildX`, `createX` and `createXBang` are typed for singular associations, with a test.
- trailmap's `declare buildSettings` can be deleted after a re-vendor.
