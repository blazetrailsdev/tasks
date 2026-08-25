---
title: "extend no-unnecessary-type-assertion coverage to tsconfig-uncovered files"
status: done
updated: 2026-06-22
rfc: "0037-no-explicit-any-enforcement"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 20
pr: 3914
claim: "2026-06-22T19:23:16Z"
assignee: "no-unnecessary-type-assertion-extend-tsconfig-coverage"
blocked-by: null
---

## Context

PR #3668 enabled `@typescript-eslint/no-unnecessary-type-assertion` with `projectService: true`. Five `.ts` files are currently excluded from the typed-lint block because `projectService` errors on files not included in any `tsconfig.json`:

- `packages/actionview/types/tse-modules.d.ts`
- `packages/activerecord/scripts/materialize-model-declares.ts`
- `packages/website/docs/.vitepress/config.ts`
- `vitest.config.ts`
- `vitest.dx-tests.config.ts`

Excluded via `eslint.config.mjs` ignores in the typed-lint block added in PR #3668.

## Acceptance criteria

- Each excluded file is reachable from at least one `tsconfig.json` (via `include`, `files`, or a project reference), OR `allowDefaultProject` is configured to cover them.
- The five `ignores` entries are removed from the typed-lint block in `eslint.config.mjs`.
- `pnpm lint` passes with no `projectService` parse errors on those files.
- `pnpm build` still passes.
