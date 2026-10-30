---
title: "Vendor @blazetrails/activerecord-cli so pnpm build can run trails-tsc"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/vendor-trails.sh`'s seed list omits `@blazetrails/activerecord-cli`, which owns the `trails-tsc` bin (trails `packages/activerecord-cli/package.json:8-11`). The vendored `trails-tsc` package ships only `trails-tsc-views`, so `typecheck-trailmap-with-trails-tsc-and-drop-model-declares` cannot start.

## Acceptance criteria

- `activerecord-cli` is in the seed list, and trails is re-vendored at a commit with repeated `--schema` (trails#8954), in its own PR.
- `pnpm exec trails-tsc --schema db/schema.ts --schema db/hub_schema.ts --noEmit` runs.
