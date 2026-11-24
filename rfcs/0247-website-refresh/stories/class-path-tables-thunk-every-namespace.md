---
title: "class-path-tables-thunk-every-namespace"
status: in-progress
updated: 2026-11-24
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10695
claim: "2026-11-24T02:49:51Z"
assignee: "class-path-tables-thunk-every-namespace"
blocked-by: null
closed-reason: null
---

## Context

trails#10683 made per-file class-path tables (`constants.<file>.generated.ts`) pass each module namespace to `defineConstants` as an arrow thunk (`scripts/api-compare/class-paths.ts` `renderClassPaths(..., lazy)`, `packages/ruby-compat/lib/classpath.ts` `_readConstantsRow`), because a host and its table import each other and Rollup can split them into cyclic chunks, so the table read the namespace `const` in TDZ.

Each package-level `constants.generated.ts` still passes eager namespaces (`lazy = table !== GENERATED`). The browser-sqlite build does not hit a TDZ there, but a bundler that splits the package entry and its table into cyclic chunks would, for the same reason. Regenerating every package table is about 2650 rows, too large to fit in #10683.

## Acceptance criteria

- `renderClassPaths` thunks every row, and the `lazy` parameter is removed.
- `pnpm parity:class-paths` regenerates every table, and `parity:class-paths:check` passes.
- `examples/browser-sqlite` still builds and `pnpm smoke` passes against `vite preview`.
