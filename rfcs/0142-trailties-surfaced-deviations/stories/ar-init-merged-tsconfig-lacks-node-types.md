---
title: "ar init: mergeTsconfig ensures compilerOptions.types includes node"
status: draft
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8241 made a fresh `ar new` project type-check by adding `@types/node` to
`AR_DEV_DEPS` (`packages/activerecord-cli/src/init.ts`) and `types: ["node"]` to
`FRESH_TSCONFIG` (`packages/activerecord-cli/src/tsconfig-merge.ts`). On TypeScript 7,
`compilerOptions.types` defaults to `[]`, so without it the scaffolded `db.ts`'s
`import.meta.dirname` fails with `TS2339: Property 'dirname' does not exist on type 'ImportMeta'`.

`ar init` into an EXISTING project goes through `mergeTsconfig`, whose
`AR_REQUIRED_OPTIONS` (`tsconfig-merge.ts:4-11`) has no `types` entry. So a project whose
tsconfig omits `types`, or lists one without `"node"`, gets `db.ts` scaffolded and then fails
`ar typecheck` with the same error. The e2e cover
(`__e2e__/sqlite-happy-path.test.ts`) only exercises `ar new`.

## Acceptance criteria

- `mergeTsconfig` ensures `"node"` is in `compilerOptions.types`: add it when `types` is
  absent, append it when `types` is an array without it, and never drop an existing entry.
  Report it in `added`, like the other required options.
- A unit test in `tsconfig-merge.test.ts` covers the absent, missing-node and present cases.
- An e2e case: `ar init` into a project with an existing tsconfig (no `types`), then
  `ar typecheck` exits 0.
