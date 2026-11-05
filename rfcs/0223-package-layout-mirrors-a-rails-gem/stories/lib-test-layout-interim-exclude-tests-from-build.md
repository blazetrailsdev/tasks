---
title: "Exclude colocated tests from every package's published build"
status: in-progress
updated: 2026-11-05
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-tooling
packages: [scripts]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9759
claim: "2026-11-05T21:27:18Z"
assignee: "lib-test-layout-interim-exclude-tests-from-build"
blocked-by: null
---

## Context

Every `packages/*/tsconfig.json` has `"rootDir": "src"`, `"include": ["src"]`
(e.g. `packages/arel/tsconfig.json`); the root `tsconfig.json` excludes only
`node_modules` and `dist`. So the 3,023 `*.test.ts` under `packages/*/src/`
(trails `b2e38a2ae5`) are emitted into `dist/`. Only 3 packages have a
`tsconfig.test.json` (`packages/ruby-compat/tsconfig.test.json`: `rootDir src`,
`include src/**/*.test.ts`, `outDir dist-test`).

## Acceptance criteria

- [ ] Every package `tsconfig.json` excludes `src/**/*.test.ts`,
      `src/**/*.trails.test.ts` and test-only helper dirs (`src/test-helpers/**`
      and the like), keeping its existing excludes.
- [ ] Every package with tests has a `tsconfig.test.json` that includes them
      and references `./tsconfig.json`; `pnpm typecheck` still type-checks every
      test file (verify a deliberate type error in one test still reds).
- [ ] After `pnpm build`, `find packages/*/dist -name '*.test.*'` is empty.
- [ ] A `lib/` file importing a test-only helper is reported in the PR body,
      not worked around.
