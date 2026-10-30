---
title: "constants.generated.ts replaces class-paths tables"
status: ready
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-framework
packages: ["ruby-compat", "scripts"]
deps: ["framework-constant-table-generator", "constantize-restored-over-namespaces"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

35 `class-paths*.generated.ts` files. RFC 0213 § "Framework constants". Rows are thunks, so no module-eval read is added. The `*.excluded` tables keep their subpath role.

## Acceptance criteria

- One `constants.generated.ts` per package serves class → path and path → class.
- `rbModName` and `constantize` read it; it stays a ruby-compat internal.
- The plain-node entry import passes in both directions for every package.
