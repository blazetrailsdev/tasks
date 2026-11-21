---
title: "no-unnecessary-type-assertion-returns-to-error-on-ts7-lint"
status: draft
updated: 2026-11-21
rfc: "0125-typescript-7-ground-floor"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# no-unnecessary-type-assertion returns to error once lint runs on TS 7

## Context

trails#10430 (`lint-and-typedoc-read-esnext-temporal-lib`) moved typescript-eslint and typedoc onto TypeScript 6.0.3 so they read `lib.esnext.temporal.d.ts`. The compiler is TS 7.1. The TS 6 checker and TS 7 disagree on inference for 45 casts in 27 files (the casts steer a generic or flow-narrowing that TS 7 needs, but TS 6 reports them as unnecessary, including the `contextuallyUnnecessary` arm, which has no option to disable). Examples: `packages/actionpack/lib/action-dispatch/routing/route-set.ts:1287`, `packages/activerecord/lib/relation/predicate-builder.ts:151`, `packages/actionpack/lib/action-dispatch/http/response.ts:57`, `packages/actionpack/lib/action-controller/metal/redirecting.ts`.

So `eslint.config.mjs` (the scoped `no-unnecessary-type-assertion` block) holds the rule at `warn` instead of `error`. Removing those casts breaks `pnpm typecheck`; keeping the rule at `error` reds Lint.

## Acceptance criteria

- typescript-eslint supports a TS version whose checker agrees with the 7.x compiler (a TS 7 typescript-eslint, or the lint chain moved onto `typescript/unstable/*`).
- `@typescript-eslint/no-unnecessary-type-assertion` is `error` again in `eslint.config.mjs`.
- Full-tree `pnpm lint` reports no `no-unnecessary-type-assertion` finding, and `pnpm typecheck` passes.
