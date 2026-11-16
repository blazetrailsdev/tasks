---
title: "actionpack DX type tests"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-actionpack
packages: [actionpack]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activerecord has `packages/activerecord/dx-tests/` (9 `*.test-d.ts`, CI step
`DX type tests`, `pnpm test:types`). actionpack has none, so nothing checks
the types a controller author sees.

## Acceptance criteria

- [ ] `packages/actionpack/dx-tests/` with its own `tsconfig.json`, added as
      a project in `vitest.dx-tests.config.ts` (as activerecord, trailties,
      actionview and rack are), run by `pnpm test:types` and the CI
      `DX type tests` step.
- [ ] At least five files: strong parameters (`require` / `permit` /
      `fetch`), `render` options, `redirectTo`, `beforeAction` callbacks,
      named route / `urlFor` helpers on a drawn route set.
- [ ] Each type the tests show is wrong is fixed in this PR if small, else
      filed as a story in this RFC with the `file:line`.
